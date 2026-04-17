import Chart from 'chart.js/auto';
import { isConnected, requestAccess, getAddress, signTransaction } from '@stellar/freighter-api';

class DashboardManager {
  constructor() {
    this.chart = null;
    this.state = {
      analysis: null,
      walletAddress: '',
      transactions: [
        { id: '1', time: '10:24 AM', intent: 'Swap 50 XLM → USDC', amount: '50.00 XLM', status: 'Success', hash: '8f2a...3e1b' },
        { id: '2', time: '09:15 AM', intent: 'Liquidity Provision', amount: '500.00 XLM', status: 'Success', hash: '2c1d...9f0e' },
        { id: '3', time: 'Yesterday', intent: 'Cross-asset Payment', amount: '12.40 XLM', status: 'Failed', hash: '5e4b...a2c1' }
      ]
    };
  }

  init() {
    this.initChart();
    this.initEventListeners();
    this.updateStats();
    this.renderTransactionHistory();
    this.renderSolverBreakdown();
  }

  initChart() {
    const ctx = document.getElementById('main-chart');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Success Performance (%)',
          data: [94, 96, 95, 98, 97, 99, 98.4],
          borderColor: '#6366F1',
          borderWidth: 3,
          backgroundColor: 'rgba(99, 102, 241, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } }
        }
      }
    });
  }

  updateCharts() {
    if (this.chart) this.chart.update();
  }

  initEventListeners() {
    const analyzeBtn = document.getElementById('analyzeIntent');
    if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.handleAnalyze());

    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) connectBtn.addEventListener('click', () => this.handleConnect());

    const executeBtn = document.getElementById('signAndExecute');
    if (executeBtn) executeBtn.addEventListener('click', () => this.handleExecute());

    const closeOverlayBtn = document.getElementById('closeXdrBtn');
    if (closeOverlayBtn) {
      closeOverlayBtn.addEventListener('click', () => {
        document.getElementById('xdrOverlay').classList.add('d-none');
      });
    }
  }

  async handleAnalyze() {
    const input = document.getElementById('intentInput').value;
    if (!input) return;

    const btn = document.getElementById('analyzeIntent');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Analyzing...';

    const reasoning = document.getElementById('reasoningPanel');
    reasoning.innerHTML = '<div class="sie-log sie-log-info">> Resolving network paths...</div>';

    try {
      const response = await fetch('http://localhost:8000/api/v1/intent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: input, amount: 100 })
      });
      const data = await response.json();
      this.state.analysis = data;

      this.updateEngineView(data);
      btn.disabled = false;
      btn.innerHTML = 'Process Strategy';
    } catch (err) {
      console.error(err);
      reasoning.innerHTML = '<div class="sie-log sie-log-error">> Engine Error: AI Node unreachable.</div>';
      btn.disabled = false;
      btn.innerHTML = 'Retry Analysis';
    }
  }

  updateEngineView(data) {
    const state = document.getElementById('engineState');
    state.classList.remove('d-none');

    document.getElementById('bestSolver').innerText = data.decision.best_solver;
    
    const reasoning = document.getElementById('reasoningPanel');
    reasoning.innerHTML = `
      <div class="sie-log sie-log-info">> Strategy localized: ${data.decision.best_solver}</div>
      <div class="sie-log sie-log-neutral">> Confidence Score: ${data.decision.confidence_score.toFixed(1)}%</div>
      <div class="sie-log sie-log-success">> Optimal multi-hop path identified via Soroban.</div>
    `;

    const consensus = document.getElementById('modelConsensus');
    // Using decision.comparison_table for mock models since it has scores
    consensus.innerHTML = data.decision.comparison_table.map(m => `
      <div class="d-flex jc-sb ai-c small mb-2">
        <span>${m.name} Oversight</span>
        <span class="fw-700">${(m.score * 10).toFixed(0)}%</span>
      </div>
    `).join('');

    const table = document.getElementById('comparisonTable');
    table.innerHTML = data.decision.comparison_table.map(s => `
      <tr>
        <td class="fw-700 pb-0 pe-3">${s.name}</td>
        <td class="pb-0 pe-3">${s.output.toFixed(2)} XLM</td>
        <td class="pb-0 pe-3">${s.fee.toFixed(4)} XLM</td>
        <td class="text-end fw-800 text-primary pb-0">${(s.score * 10).toFixed(0)}</td>
      </tr>
    `).join('');
  }

  async handleExecute() {
    if (!this.state.analysis) return;
    
    try {
      // Show XDR Overlay
      const xdr = "AAAAAgAAAAB/R98q... (Simulated Soroban XDR)";
      document.getElementById('xdrPreview').innerText = xdr;
      document.getElementById('xdrOverlay').classList.remove('d-none');
      
      // Simulate Freighter Signing
      if (await isConnected()) {
         // const signedXdr = await signTransaction(xdr);
         console.log("Mock signing trigger...");
      }
      
      // Update UI with new transaction
      const newTx = {
        id: Date.now().toString(),
        time: 'Just now',
        intent: document.getElementById('intentInput').value.substring(0, 20) + '...',
        amount: '100.00 XLM',
        status: 'Success',
        hash: 'tx_' + Math.random().toString(36).substr(2, 8)
      };
      
      this.state.transactions.unshift(newTx);
      this.renderTransactionHistory();
      this.updateStats();
      
    } catch (err) {
      console.error('Execution Failed:', err);
    }
  }

  async handleConnect() {
    try {
      await requestAccess();
      const addr = await getAddress();
      this.state.walletAddress = addr.address;
      document.getElementById('walletStatus').innerText = `${addr.address.slice(0, 4)}...${addr.address.slice(-4)}`;
      document.getElementById('connectWallet').innerText = 'Connected';
    } catch (e) {
      console.error('Wallet Error:', e);
    }
  }

  renderTransactionHistory() {
    const table = document.getElementById('transactionHistoryTable');
    if (!table) return;

    table.innerHTML = this.state.transactions.map(tx => `
      <tr>
        <td class="ps-4 text-muted">${tx.time}</td>
        <td class="fw-700">${tx.intent}</td>
        <td>${tx.amount}</td>
        <td class="text-center">
          <span class="badge rounded-pill ${tx.status === 'Success' ? 'bg-success' : 'bg-danger'} smaller px-3" style="font-size: 10px; color: white;">
            ${tx.status}
          </span>
        </td>
        <td class="pe-4 text-end">
          <a href="https://stellar.expert/explorer/testnet/tx/${tx.hash}" target="_blank" class="text-primary text-decoration-none smaller">EXT ↗</a>
        </td>
      </tr>
    `).join('');
  }

  renderSolverBreakdown() {
    const container = document.getElementById('solverBreakdownList');
    if (!container) return;

    const solvers = [
      { name: 'BridgeFlow Alpha', volume: '142.5k', color: '#6366F1', p: 85 },
      { name: 'NeuralLiquidity V2', volume: '89.2k', color: '#F97316', p: 60 },
      { name: 'Horizon Router', volume: '44.8k', color: '#0F172A', p: 35 }
    ];

    container.innerHTML = solvers.map(s => `
      <div>
        <div class="d-flex jc-sb small mb-1">
          <span class="text-muted smaller fw-600">${s.name}</span>
          <span class="fw-700">${s.volume}</span>
        </div>
        <div class="progress" style="height: 6px; background: #f1f5f9;">
          <div class="progress-bar" style="width: ${s.p}%; background: ${s.color}"></div>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    const txCount = document.getElementById('kpi-total-tx');
    const volSum = document.getElementById('kpi-total-volume');
    
    if (txCount) txCount.innerText = this.state.transactions.length;
    if (volSum) {
      const vol = this.state.transactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
      volSum.innerText = vol.toLocaleString(undefined, { minimumFractionDigits: 2 });
    }
  }
}

export default new DashboardManager();
