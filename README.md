# Stellar Intent Engine (SIE)

Stellar Intent Engine is an advanced AI-powered transaction orchestrator for the Stellar Network. It analyzes natural language intents, evaluates multiple AI strategies in parallel, optimizes execution via specialized solvers, and submits verified proof-of-execution to a Soroban smart contract.

## 🚀 Key Features

*   **Premium SaaS Dashboard**: Real-time analytics, KPI tracking, and AI reasoning visualization (`/dashboard.html`).
*   **AI Consensus Engine**: Parallel evaluation using GPT, Claude, and Llama strategies.
*   **Multi-Strategy Solvers**: Optimized for Fees, Output, Risk, and Hybrid pathing.
*   **Soroban Proof Trail**: Persistent on-chain logging of intent metadata.
*   **Wallet Integration**: Secure client-side signing via Freighter wallet.
*   **Production-Ready**: Dockerized architecture with full CI/CD support.


## Project Structure

- `backend/` FastAPI API for intent analysis, solver simulation, decisioning, and XDR handling
- `frontend/` Adminator-based fintech dashboard with Freighter integration
- `contracts/` Soroban contract, tests, and deployment notes
- `cli/` legacy CLI entrypoint

## Backend

Key modules:

- [backend/ai_engine.py](/Users/ahir/Projects/stellar_lv6-master/backend/ai_engine.py)
- [backend/solver_engine.py](/Users/ahir/Projects/stellar_lv6-master/backend/solver_engine.py)
- [backend/decision_engine.py](/Users/ahir/Projects/stellar_lv6-master/backend/decision_engine.py)
- [backend/stellar.py](/Users/ahir/Projects/stellar_lv6-master/backend/stellar.py)
- [backend/routes.py](/Users/ahir/Projects/stellar_lv6-master/backend/routes.py)

API flow:

1. `POST /api/v1/intent/analyze`
2. `POST /api/v1/transactions/build`
3. Freighter signs the returned XDR in the browser
4. `POST /api/v1/transactions/submit`

## Frontend

Main intent dashboard assets:

- [frontend/src/intent-engine.html](/Users/ahir/Projects/stellar_lv6-master/frontend/src/intent-engine.html)
- [frontend/src/assets/scripts/intentEngine/index.js](/Users/ahir/Projects/stellar_lv6-master/frontend/src/assets/scripts/intentEngine/index.js)
- [frontend/src/assets/styles/spec/screens/intent-engine.scss](/Users/ahir/Projects/stellar_lv6-master/frontend/src/assets/styles/spec/screens/intent-engine.scss)

## Soroban Contract

Contract source:

- [contracts/intent_engine.rs](/Users/ahir/Projects/stellar_lv6-master/contracts/intent_engine.rs)

Build and deploy notes:

- [contracts/README.md](/Users/ahir/Projects/stellar_lv6-master/contracts/README.md)

## Run Locally

### 1. Python environment

```bash
cd /Users/ahir/Projects/stellar_lv6-master
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the backend

```bash
cd /Users/ahir/Projects/stellar_lv6-master
. .venv/bin/activate
python -m uvicorn backend.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd /Users/ahir/Projects/stellar_lv6-master/frontend
npm install
npm start
```

Open [intent-engine.html](http://localhost:4000/intent-engine.html).

### 4. Contract tests

```bash
cd /Users/ahir/Projects/stellar_lv6-master/contracts
cargo test
```

## Validation

Backend:

```bash
cd /Users/ahir/Projects/stellar_lv6-master
. .venv/bin/activate
pytest backend/tests -q
```

Frontend:

```bash
cd /Users/ahir/Projects/stellar_lv6-master/frontend
npm run test:run
npm run lint:js
npm run lint:scss
npm run build
```

Contract:

```bash
cd /Users/ahir/Projects/stellar_lv6-master/contracts
cargo test
```

## Notes

- The backend never signs transactions or stores private keys.
- Transaction submission is intentionally mock-safe by default. Set `SIE_SUBMIT_TO_NETWORK=true` only after wiring live Horizon submission and funded testnet accounts.
- The AI layer is deterministic and demo-safe today, but the architecture is async and ready for live provider adapters.
