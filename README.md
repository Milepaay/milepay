# MilePay

Milestone-based escrow for freelancers, built on [Stellar](https://stellar.org) using [Soroban](https://soroban.stellar.org) smart contracts.

Clients deposit funds upfront. Payment releases per milestone — on-chain, no middleman.

---

## How it works

1. Client creates an escrow with a list of milestones and deposits the full amount
2. Freelancer completes each milestone and requests release
3. Client approves — funds transfer instantly on Stellar
4. If there's a dispute, an arbitrator resolves it on-chain

---

## Repo structure

```
milepay/
├── contracts/
│   └── escrow/          # Soroban smart contract (Rust)
│       └── src/lib.rs
└── frontend/            # React + TypeScript UI
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/         # Contract client, wallet adapter
    │   ├── pages/
    │   └── types/
    └── index.html
```

---

## Getting started

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- Node.js 18+
- [Freighter](https://freighter.app) or [LOBSTR](https://lobstr.co) wallet extension

### Contract

```bash
# Install wasm target
rustup target add wasm32-unknown-unknown

# Build
cargo build --target wasm32-unknown-unknown --release

# Test
cargo test

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/milepay_escrow.wasm \
  --network testnet \
  --source <your-account>
```

After deploying, copy the contract ID for the next step.

### Frontend

```bash
cd frontend
npm install

# Create a .env file
echo "VITE_CONTRACT_ID=<your-deployed-contract-id>" > .env

npm run dev
```

Open `http://localhost:5173`, connect your Freighter wallet (set to Testnet), and you're live.

---

## Contract interface

| Method | Caller | Description |
|--------|--------|-------------|
| `initialize(admin)` | Deployer | One-time setup |
| `create_escrow(client, freelancer, token, amounts, descs)` | Client | Deposit funds, define milestones |
| `release_milestone(escrow_id, milestone_id)` | Client | Release one milestone payment |
| `dispute(escrow_id)` | Client | Flag escrow for arbitration |
| `resolve_dispute(escrow_id, recipient)` | Admin | Send remaining funds to winner |
| `refund(escrow_id)` | Client | Return unreleased funds |
| `get_escrow(escrow_id)` | Anyone | Read escrow state |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — or browse the [open issues](https://github.com/Milepaay/milepay/issues).

Issues tagged **good first issue** are a great place to start — no prior Soroban experience required for several of them.

---

## License

MIT
