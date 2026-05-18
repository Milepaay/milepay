import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  allowAllModules,
} from "@creit.tech/stellar-wallets-kit";
import { NETWORK_PASSPHRASE } from "./constants";

export const walletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

export async function connectWallet(): Promise<string> {
  await walletsKit.openModal({
    onWalletSelected: async (option: { id: string }) => {
      walletsKit.setWallet(option.id);
    },
  });
  const { address } = await walletsKit.getAddress();
  return address;
}

export async function signTransaction(xdr: string): Promise<string> {
  const { signedTxXdr } = await walletsKit.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  return signedTxXdr;
}
