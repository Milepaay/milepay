import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL, NETWORK_PASSPHRASE } from "./constants";
import type { Escrow, CreateEscrowParams } from "../types";

const server = new SorobanRpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

async function invokeContract(
  sourceKeypair: { publicKey: () => string; sign: (msg: Uint8Array) => Uint8Array },
  method: string,
  args: xdr.ScVal[]
) {
  const account = await server.getAccount(sourceKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(sourceKeypair as never);

  const response = await server.sendTransaction(prepared);
  if (response.status === "ERROR") throw new Error(response.errorResult?.toXDR("base64"));

  // Poll for confirmation
  let result = await server.getTransaction(response.hash);
  while (result.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    result = await server.getTransaction(response.hash);
  }

  if (result.status === "SUCCESS" && result.returnValue) {
    return scValToNative(result.returnValue);
  }

  throw new Error("Transaction failed");
}

type Signer = Parameters<typeof invokeContract>[0];

export async function createEscrow(
  signer: Signer,
  params: CreateEscrowParams & { clientAddress: string }
): Promise<number> {
  const amounts = params.milestones.map((m) =>
    nativeToScVal(BigInt(m.amount), { type: "i128" })
  );
  const descs = params.milestones.map((m) =>
    nativeToScVal(m.description, { type: "string" })
  );

  const id = await invokeContract(signer, "create_escrow", [
    new Address(params.clientAddress).toScVal(),
    new Address(params.freelancer).toScVal(),
    new Address(params.token).toScVal(),
    xdr.ScVal.scvVec(amounts),
    xdr.ScVal.scvVec(descs),
  ]);

  return Number(id);
}

export async function releaseMilestone(
  signer: Signer,
  escrowId: number,
  milestoneId: number
): Promise<void> {
  await invokeContract(signer, "release_milestone", [
    nativeToScVal(escrowId, { type: "u32" }),
    nativeToScVal(milestoneId, { type: "u32" }),
  ]);
}

export async function disputeEscrow(
  signer: Signer,
  escrowId: number
): Promise<void> {
  await invokeContract(signer, "dispute", [
    nativeToScVal(escrowId, { type: "u32" }),
  ]);
}

export async function refundEscrow(
  signer: Signer,
  escrowId: number
): Promise<void> {
  await invokeContract(signer, "refund", [
    nativeToScVal(escrowId, { type: "u32" }),
  ]);
}

export async function getEscrow(escrowId: number): Promise<Escrow> {
  const account = await server.getAccount(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN" // dummy for reads
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("get_escrow", nativeToScVal(escrowId, { type: "u32" }))
    )
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationSuccess(result) && result.result) {
    return scValToNative(result.result.retval) as Escrow;
  }
  throw new Error("Failed to fetch escrow");
}
