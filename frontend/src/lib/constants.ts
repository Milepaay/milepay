export const NETWORK_PASSPHRASE =
  "Test SDF Network ; September 2015"; // swap for mainnet passphrase in prod

export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const RPC_URL = "https://soroban-testnet.stellar.org";

// Fill in after deploying the contract
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "";

// USDC on testnet (Circle testnet asset)
export const USDC_TOKEN =
  import.meta.env.VITE_USDC_TOKEN ??
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const STROOPS_PER_XLM = 10_000_000n;
