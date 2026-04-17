import { getAddress, getNetworkDetails, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

const BACKEND_URL = 'http://localhost:8000/api/v1';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const state = {
  analysis: null,
  walletAddress: '',
  signedXdr: '',
};

const elements = {};

const formatNumber = (value) => Number(value).toFixed(4);

const logLine = (message, tone = 'neutral') => {
  if (!elements.terminalLogs) return;
  const div = document.createElement('div');
  div.className = `sie-log sie-log-${tone}`;
  div.innerHTML = `&gt; [${new Date().toLocaleTimeString()}] ${message}`;
  elements.terminalLogs.appendChild(div);
  elements.terminalLogs.scrollTop = elements.terminalLogs.scrollHeight;
};

const setStatus = (text, meta = '') => {
  elements.statusText.textContent = text;
  if (meta) elements.walletStatus.textContent = meta;
};

const toggleLoading = (active) => {
  elements.loadingRail.classList.toggle('is-active', active);
};

const renderModels = (payload) => {
  elements.bestModelBadge.textContent = `Best model: ${payload.decision.best_model}`;
  elements.modelResults.innerHTML = payload.model_execution.results.map((result) => `
    <article class="sie-result-card ${result.model === payload.decision.best_model ? 'is-best' : ''}">
      <div class="sie-result-top"><h5>${result.model}</h5><span class="badge text-bg-dark">${Math.round(result.confidence * 100)}% confidence</span></div>
      <div class="sie-metric-row"><span>Route</span><strong>${result.route.join(' -> ')}</strong></div>
      <div class="sie-metric-row"><span>Output</span><strong>${formatNumber(result.output)}</strong></div>
      <div class="sie-metric-row"><span>Fee</span><strong>${formatNumber(result.fee)}</strong></div>
      <div class="sie-metric-row"><span>Risk</span><strong>${formatNumber(result.risk)}</strong></div>
      <p class="sie-card-copy">${result.reasoning}</p>
    </article>
  `).join('');
};

const renderSolvers = (payload) => {
  elements.bestSolverBadge.textContent = `Best solver: ${payload.decision.best_solver}`;
  elements.solverResults.innerHTML = payload.solver_results.map((solver) => `
    <article class="sie-result-card ${solver.solver_id === payload.decision.best_solver ? 'is-best' : ''}">
      <div class="sie-result-top"><h5>${solver.solver_id}</h5><span class="badge text-bg-secondary">${solver.solver_type}</span></div>
      <div class="sie-metric-row"><span>Output</span><strong>${formatNumber(solver.output)}</strong></div>
      <div class="sie-metric-row"><span>Fee</span><strong>${formatNumber(solver.fee)}</strong></div>
      <div class="sie-metric-row"><span>Slippage</span><strong>${formatNumber(solver.slippage)}</strong></div>
      <div class="sie-metric-row"><span>Risk</span><strong>${formatNumber(solver.risk)}</strong></div>
      <div class="sie-metric-row"><span>Hook fee</span><strong>${formatNumber(solver.hooks.dynamic_fee_multiplier)}</strong></div>
      <p class="sie-card-copy">${solver.route.join(' -> ')}</p>
    </article>
  `).join('');
};

const renderDecision = (payload) => {
  elements.reasoningPanel.innerHTML = `
    <p><strong>Model round:</strong> ${payload.model_execution.reasoning}</p>
    <p><strong>Decision engine:</strong> ${payload.decision.explanation}</p>
  `;
  elements.comparisonTable.innerHTML = payload.decision.comparison_table.map((row) => `
    <tr>
      <td>${row.name}</td>
      <td>${row.category}</td>
      <td>${formatNumber(row.output)}</td>
      <td>${formatNumber(row.fee)}</td>
      <td>${formatNumber(row.risk)}</td>
      <td>${formatNumber(row.score)}</td>
    </tr>
  `).join('');
};

const connectWallet = async () => {
  setStatus('Checking Freighter availability…');
  const connection = await isConnected();
  if (connection.error || !connection.isConnected) {
    throw new Error(connection.error || 'Freighter extension not detected.');
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error);
  }

  const addressResponse = await getAddress();
  if (addressResponse.error || !addressResponse.address) {
    throw new Error(addressResponse.error || 'Unable to read wallet address.');
  }

  const network = await getNetworkDetails();
  if (network.error) {
    throw new Error(network.error);
  }
  if (network.networkPassphrase !== TESTNET_PASSPHRASE) {
    throw new Error(`Freighter must be on Stellar testnet (${TESTNET_PASSPHRASE}).`);
  }

  state.walletAddress = addressResponse.address;
  elements.walletAddress.textContent = state.walletAddress;
  elements.connectWallet.textContent = `${state.walletAddress.slice(0, 6)}...${state.walletAddress.slice(-4)}`;
  setStatus('Wallet connected.', `Freighter on ${network.network}`);
  logLine(`Freighter connected for ${state.walletAddress}.`, 'wallet');
};

const analyzeIntent = async () => {
  const intent = elements.intentInput.value.trim();
  const amount = Number(elements.amountInput.value || 0);
  if (!intent || amount <= 0) {
    throw new Error('Enter a valid intent and amount.');
  }

  toggleLoading(true);
  setStatus('Running models…', 'Simulating liquidity and optimizers.');
  logLine(`Analyzing intent: "${intent}"`, 'info');

  const response = await fetch(`${BACKEND_URL}/intent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent,
      amount,
      destination: elements.destinationInput.value.trim() || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Intent analysis failed with status ${response.status}.`);
  }

  state.analysis = await response.json();
  renderModels(state.analysis);
  renderSolvers(state.analysis);
  renderDecision(state.analysis);
  elements.signAndExecute.disabled = false;
  setStatus('Optimization complete.', `Best model ${state.analysis.decision.best_model}, best solver ${state.analysis.decision.best_solver}`);
  logLine(`Optimization complete. Selected ${state.analysis.decision.best_solver}.`, 'success');
};

const buildAndSign = async () => {
  if (!state.analysis) throw new Error('Run analysis before execution.');
  if (!state.walletAddress) throw new Error('Connect Freighter before signing.');

  const bestSolver = state.analysis.solver_results.find((solver) => solver.solver_id === state.analysis.decision.best_solver);
  if (!bestSolver) throw new Error('Selected solver details are unavailable.');

  setStatus('Building unsigned Stellar transaction…', 'Preparing XDR for Freighter signature.');
  logLine('Building unsigned transaction XDR.', 'info');

  const buildResponse = await fetch(`${BACKEND_URL}/transactions/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: state.analysis.intent_summary.intent,
      source_public_key: state.walletAddress,
      destination_public_key: elements.destinationInput.value.trim() || state.analysis.intent_summary.destination,
      source_asset: state.analysis.intent_summary.source_asset,
      destination_asset: state.analysis.intent_summary.destination_asset,
      amount: Number(elements.amountInput.value || 0),
      best_model: state.analysis.decision.best_model,
      best_solver: state.analysis.decision.best_solver,
      route: bestSolver.route,
      destination_min: bestSolver.output,
    }),
  });

  if (!buildResponse.ok) throw new Error(`Unable to build transaction: ${buildResponse.status}`);
  const buildPayload = await buildResponse.json();

  elements.xdrStatus.textContent = 'Built';
  elements.xdrPreview.textContent = buildPayload.xdr;
  logLine(`Simulation ready. Resource fee ${buildPayload.simulation.min_resource_fee}, ledger ${buildPayload.simulation.latest_ledger}.`, 'info');
  setStatus('Awaiting wallet signature…', 'Freighter confirmation required.');
  logLine('Requesting Freighter signature.', 'wallet');

  const signedResponse = await signTransaction(buildPayload.xdr, {
    networkPassphrase: buildPayload.network_passphrase,
    address: state.walletAddress,
  });

  if (signedResponse.error || !signedResponse.signedTxXdr) {
    throw new Error(signedResponse.error || 'User rejected signature request.');
  }

  state.signedXdr = signedResponse.signedTxXdr;
  logLine('Signed XDR returned from Freighter.', 'success');

  const submitResponse = await fetch(`${BACKEND_URL}/transactions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signed_xdr: state.signedXdr,
      intent: state.analysis.intent_summary.intent,
      best_model: state.analysis.decision.best_model,
      best_solver: state.analysis.decision.best_solver,
    }),
  });

  if (!submitResponse.ok) throw new Error(`Submission failed with status ${submitResponse.status}`);
  const submitted = await submitResponse.json();

  elements.txHash.innerHTML = `<a href="${submitted.explorer_url}" target="_blank" rel="noreferrer">${submitted.hash.slice(0, 16)}...</a>`;
  elements.sorobanProof.textContent = `${submitted.soroban_event.best_model} / ${submitted.soroban_event.best_solver}`;
  setStatus('Execution submitted.', `${submitted.status} to Stellar flow`);
  logLine(`Execution submitted with hash ${submitted.hash}.`, 'success');
};

const bindElements = () => {
  elements.intentInput = document.getElementById('intentInput');
  elements.destinationInput = document.getElementById('destinationInput');
  elements.amountInput = document.getElementById('amountInput');
  elements.analyzeIntent = document.getElementById('analyzeIntent');
  elements.signAndExecute = document.getElementById('signAndExecute');
  elements.connectWallet = document.getElementById('connectWallet');
  elements.statusText = document.getElementById('statusText');
  elements.walletStatus = document.getElementById('walletStatus');
  elements.bestModelBadge = document.getElementById('bestModelBadge');
  elements.bestSolverBadge = document.getElementById('bestSolverBadge');
  elements.modelResults = document.getElementById('modelResults');
  elements.solverResults = document.getElementById('solverResults');
  elements.reasoningPanel = document.getElementById('reasoningPanel');
  elements.comparisonTable = document.getElementById('comparisonTable');
  elements.walletAddress = document.getElementById('walletAddress');
  elements.xdrStatus = document.getElementById('xdrStatus');
  elements.txHash = document.getElementById('txHash');
  elements.sorobanProof = document.getElementById('sorobanProof');
  elements.xdrPreview = document.getElementById('xdrPreview');
  elements.terminalLogs = document.getElementById('terminalLogs');
  elements.loadingRail = document.getElementById('loadingRail');
};

const initIntentEngine = () => {
  if (!document.querySelector('[data-intent-engine]')) return;
  bindElements();

  elements.connectWallet.addEventListener('click', async () => {
    try {
      await connectWallet();
    } catch (error) {
      logLine(error.message, 'error');
      setStatus('Wallet connection failed.', error.message);
    }
  });

  elements.analyzeIntent.addEventListener('click', async () => {
    try {
      await analyzeIntent();
    } catch (error) {
      logLine(error.message, 'error');
      setStatus('Analysis failed.', error.message);
    } finally {
      toggleLoading(false);
    }
  });

  elements.signAndExecute.addEventListener('click', async () => {
    try {
      toggleLoading(true);
      await buildAndSign();
    } catch (error) {
      logLine(error.message, 'error');
      setStatus('Execution failed.', error.message);
    } finally {
      toggleLoading(false);
    }
  });

  logLine('Intent dashboard ready.', 'info');
};

document.addEventListener('DOMContentLoaded', initIntentEngine);
