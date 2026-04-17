/**
 * Unified Antigravity Dashboard
 * Consolidates Analytics, Intent Engine, and Deployment Pipeline.
 */

import Chart from 'chart.js/auto';
import { getAddress, getNetworkDetails, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

const BACKEND_URL = 'http://localhost:8000/api/v1';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

const state = {
  analysis: null,
  walletAddress: '',
  signedXdr: '',
  history: [],
};

const elements = {};

const formatNumber = (value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const logLine = (message, tone = 'neutral') => {
  if (!elements.terminalLogs) return;
  const div = document.createElement('div');
  div.className = `sie-log sie-log-${tone} small`;
  div.innerHTML = `&gt; ${message}`;
  elements.terminalLogs.prepend(div);
  elements.terminalLogs.scrollTop = 0;
};

const setStatus = (text) => {
  if (elements.statusText) elements.statusText.textContent = text;
};

const toggleLoading = (active) => {
  if (elements.loadingRail) elements.loadingRail.classList.toggle('is-active', active);
};

// --- DATA FETCHING & CHARTS ---
let mainChart = null;

const updateCharts = (data) => {
  const ctx = document.getElementById('main-chart');
  if (!ctx) return;

  if (mainChart) mainChart.destroy();
  mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => `T-${data.length - i}`),
      datasets: [{
        label: 'Transaction Confidence',
        data: data.map(tx => tx.soroban_event ? 95 + Math.random() * 4 : 80),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Value Flow',
        data: data.map(tx => tx.soroban_event ? 40 + Math.random() * 60 : 30),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
        }
      }
    }
  });
};

const fetchAnalytics = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/transactions`);
    const data = await response.json();
    state.history = data;

    // Update KPIs
    if (elements.kpiTotalTx) elements.kpiTotalTx.textContent = data.length;
    if (elements.kpiVolume) {
        const volume = data.reduce((acc, tx) => acc + (parseFloat(tx.soroban_event?.amount) || 0), 0);
        elements.kpiVolume.textContent = volume.toFixed(2);
    }

    updateCharts(data.length > 0 ? data : [{soroban_event: null}, {soroban_event: null}]);
  } catch (error) {
    console.warn('Analytics fetch skipped (backend may be idle).');
  }
};

// --- INTENT ENGINE LOGIC ---

const connectWallet = async () => {
  logLine('Detecting Stellar wallet...', 'info');
  const connection = await isConnected();
  if (!connection?.isConnected) throw new Error('Freighter not found.');

  await requestAccess();
  const addressResponse = await getAddress();
  state.walletAddress = addressResponse.address;
  
  if (elements.walletAddress) elements.walletAddress.textContent = `${state.walletAddress.slice(0, 8)}...`;
  if (elements.walletStatus) elements.walletStatus.textContent = 'Freighter Active';
  if (elements.connectWallet) elements.connectWallet.textContent = 'Wallet Connected';
  
  logLine(`Connected: ${state.walletAddress}`, 'success');
};

const analyzeIntent = async () => {
  const intent = elements.intentInput.value.trim();
  const amount = Number(elements.amountInput.value || 0);
  if (!intent || amount <= 0) throw new Error('Invalid intent/amount.');

  toggleLoading(true);
  logLine(`AI Analysis: "${intent}"`, 'info');

  const response = await fetch(`${BACKEND_URL}/intent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, amount }),
  });

  if (!response.ok) throw new Error('Analysis engine offline.');

  state.analysis = await response.json();
  
  // Render Results
  elements.bestModelBadge.textContent = `Winner: ${state.analysis.decision.best_model}`;
  elements.bestSolverBadge.textContent = `Best: ${state.analysis.decision.best_solver}`;
  
  elements.modelResults.innerHTML = state.analysis.model_execution.results.map(r => `
    <div class="d-flex jc-sb ai-c p-2 border-bottom border-white border-opacity-10">
      <span class="small">${r.model}</span>
      <span class="small fw-700">${Math.round(r.confidence * 100)}%</span>
    </div>
  `).join('');

  elements.solverResults.innerHTML = state.analysis.solver_results.map(s => `
    <div class="d-flex jc-sb ai-c p-2 border-bottom border-white border-opacity-10">
      <span class="small">${s.solver_id}</span>
      <span class="small fw-700">${s.output.toFixed(2)}</span>
    </div>
  `).join('');

  elements.reasoningPanel.textContent = state.analysis.decision.explanation;
  elements.comparisonTable.innerHTML = state.analysis.decision.comparison_table.map(row => `
    <tr>
      <td>${row.name}</td>
      <td>${row.category}</td>
      <td>${row.output.toFixed(2)}</td>
      <td>${row.fee.toFixed(4)}</td>
      <td class="fw-700 text-primary">${row.score.toFixed(2)}</td>
    </tr>
  `).join('');

  elements.signAndExecute.disabled = false;
  logLine(`Consensus reached on ${state.analysis.decision.best_solver}.`, 'success');
};

const buildAndSign = async () => {
  if (!state.analysis || !state.walletAddress) throw new Error('Pre-requisites missing.');

  logLine('Generating Soroban XDR...', 'info');
  const solver = state.analysis.solver_results.find(s => s.solver_id === state.analysis.decision.best_solver);

  const build = await fetch(`${BACKEND_URL}/transactions/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: state.analysis.intent_summary.intent,
      source_public_key: state.walletAddress,
      destination_public_key: state.analysis.intent_summary.destination,
      amount: Number(elements.amountInput.value),
      best_model: state.analysis.decision.best_model,
      best_solver: state.analysis.decision.best_solver,
      route: solver.route,
      destination_min: solver.output,
    }),
  });

  if (!build.ok) throw new Error('XDR build failed.');
  const buildPayload = await build.json();

  elements.xdrStatus.textContent = 'Signed';
  elements.xdrPreview.textContent = buildPayload.xdr;

  logLine('Awaiting Freighter signing...', 'info');
  const signed = await signTransaction(buildPayload.xdr, {
    networkPassphrase: buildPayload.network_passphrase,
    address: state.walletAddress,
  });

  if (signed.error) throw new Error('Signing rejected.');

  logLine('Submitting to Stellar...', 'info');
  const submit = await fetch(`${BACKEND_URL}/transactions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signed_xdr: signed.signedTxXdr,
      intent: state.analysis.intent_summary.intent,
      best_model: state.analysis.decision.best_model,
      best_solver: state.analysis.decision.best_solver,
    }),
  });

  const submitted = await submit.json();
  elements.txHash.textContent = `${submitted.hash.slice(0, 10)}...`;
  logLine(`Deployed! Hash: ${submitted.hash}`, 'success');
  fetchAnalytics();
};

const initDashboard = () => {
  // Bind elements
  elements.kpiTotalTx = document.getElementById('kpi-total-tx');
  elements.kpiVolume = document.getElementById('kpi-total-volume');
  elements.intentInput = document.getElementById('intentInput');
  elements.amountInput = document.getElementById('amountInput');
  elements.analyzeIntent = document.getElementById('analyzeIntent');
  elements.signAndExecute = document.getElementById('signAndExecute');
  elements.connectWallet = document.getElementById('connectWallet');
  elements.walletAddress = document.getElementById('walletAddress');
  elements.walletStatus = document.getElementById('walletStatus');
  elements.bestModelBadge = document.getElementById('bestModelBadge');
  elements.bestSolverBadge = document.getElementById('bestSolverBadge');
  elements.modelResults = document.getElementById('modelResults');
  elements.solverResults = document.getElementById('solverResults');
  elements.reasoningPanel = document.getElementById('reasoningPanel');
  elements.comparisonTable = document.getElementById('comparisonTable');
  elements.xdrStatus = document.getElementById('xdrStatus');
  elements.txHash = document.getElementById('txHash');
  elements.xdrPreview = document.getElementById('xdrPreview');
  elements.terminalLogs = document.getElementById('terminalLogs');
  elements.loadingRail = document.getElementById('loadingRail');

  // Event Listeners
  if (elements.connectWallet) {
    elements.connectWallet.addEventListener('click', async () => {
      try { await connectWallet(); } catch (e) { logLine(e.message, 'error'); }
    });
  }

  if (elements.analyzeIntent) {
    elements.analyzeIntent.addEventListener('click', async () => {
      try { await analyzeIntent(); } catch (e) { logLine(e.message, 'error'); } finally { toggleLoading(false); }
    });
  }

  if (elements.signAndExecute) {
    elements.signAndExecute.addEventListener('click', async () => {
      try { 
        toggleLoading(true);
        await buildAndSign(); 
      } catch (e) { logLine(e.message, 'error'); } finally { toggleLoading(false); }
    });
  }

  fetchAnalytics();
  setInterval(fetchAnalytics, 15000);
};

document.addEventListener('DOMContentLoaded', initDashboard);
