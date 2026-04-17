# Soroban Contract

This contract records the proof trail for a Stellar Intent Engine execution:

- `intent_hash`
- `selected_model`
- `selected_solver`
- `executor`

## Build

```bash
cd /Users/ahir/Projects/stellar_lv6-master/contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
```

## Deploy

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/sie_intent_engine.wasm \
  --source alice \
  --network testnet
```

## Invoke

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- log_execution \
  --intent_hash 0707070707070707070707070707070707070707070707070707070707070707 \
  --selected_model gpt \
  --selected_solver hybrid \
  --executor GBRPYHIL2C6LY4EWOLR2Q5X5ZZOG2O4K4VJXCC6DK6I7MSM4VQX2D2B6
```

## Read back

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- get_execution \
  --intent_hash 0707070707070707070707070707070707070707070707070707070707070707
```
