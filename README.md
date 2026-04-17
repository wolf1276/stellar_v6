# Stellar Intent Engine (SIE)

Stellar Intent Engine is an advanced AI-powered transaction orchestrator for the Stellar Network. It analyzes natural language intents, evaluates multiple AI strategies in parallel, optimizes execution via specialized solvers, and submits verified proof-of-execution to a Soroban smart contract.

## 🚀 Key Features

*   **Premium SaaS Dashboard**: Real-time analytics, KPI tracking, and AI reasoning visualization (`/index.html`).
*   **AI Consensus Engine**: Parallel evaluation using GPT, Claude, and Llama strategies.
*   **Multi-Strategy Solvers**: Optimized for Fees, Output, Risk, and Hybrid pathing.
*   **Soroban Proof Trail**: Persistent on-chain logging of intent metadata.
*   **Wallet Integration**: Secure client-side signing via Freighter wallet.
*   **Production-Ready**: Dockerized architecture with full CI/CD support.

## Project Structure

- `backend/` FastAPI API for intent analysis, solver simulation, decisioning, and XDR handling
- `frontend/` Adminator-based fintech dashboard with Freighter integration
- `contracts/` Soroban contract, tests, and deployment notes

## 👷 CI/CD (GitHub Actions)

The project includes a comprehensive CI pipeline:
- **Linting**: Automated Python (Ruff), JavaScript (ESLint), and SCSS (Stylelint) checks.
- **Testing**: Parallel execution of Backend (pytest) and Contract (cargo test) suites.
- **Build Validation**: Ensures frontend assets and contract WASM compile correctly.
- **Docker Verification**: Validates the `docker-compose` stack on every push.

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
- [frontend/src/index.html](/Users/ahir/Projects/stellar_lv6-master/frontend/src/index.html) (Primary Dashboard)
- [frontend/src/intent-engine.html](/Users/ahir/Projects/stellar_lv6-master/frontend/src/intent-engine.html) (Execution Engine)
- [frontend/src/assets/scripts/intentEngine/index.js](/Users/ahir/Projects/stellar_lv6-master/frontend/src/assets/scripts/intentEngine/index.js)

## Run Locally

### 1. Python environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the backend
```bash
uvicorn backend.main:app --reload --port 8000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm start
```

Open [index.html](http://localhost:4000/index.html) for the dashboard.

## Validation

Backend:
```bash
pytest
```

Frontend:
```bash
cd frontend
npm run lint:js
npm run lint:scss
npm run build
```

Contract:
```bash
cd contracts
cargo test
```

## Docker Stack
To run the full production-ready stack:
```bash
docker-compose up --build
```
Note: Ensure Docker Desktop is running on your machine.

