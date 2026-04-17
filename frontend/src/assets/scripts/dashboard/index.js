import Chart from 'chart.js/auto';
import { connectFreighter } from '../utils/wallet';

const initDashboard = () => {
    if (!document.querySelector('[data-dashboard]')) return;

    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            try {
                const wallet = await connectFreighter();
                connectBtn.textContent = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
                connectBtn.classList.remove('btn-outline-primary');
                connectBtn.classList.add('btn-success');
            } catch (error) {
                console.error('Wallet connection failed:', error);
            }
        });
    }

    // --- Charts Holders ---
    let volumeChart = null;

    const updateCharts = (data) => {
        const lineCtx = document.getElementById('volumeChart');
        if (lineCtx) {
            if (volumeChart) volumeChart.destroy();
            volumeChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => `T-${data.length - i}`),
                    datasets: [{
                        label: 'Volume',
                        data: data.map(tx => parseFloat(tx.intent.amount) || 0),
                        fill: true,
                        borderColor: '#ff6849',
                        backgroundColor: 'rgba(255, 104, 73, 0.1)',
                        tension: 0.4,
                        pointRadius: 2,
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                }
            });
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/transactions');
            const data = await response.json();
            
            // Update Table
            const txBody = document.getElementById('transactionTableBody');
            if (txBody) {
                txBody.innerHTML = data.slice(0, 5).map(tx => `
                    <tr>
                        <td>${tx.intent.asset_type || 'Payment'}</td>
                        <td><span class="badge rounded-pill text-bg-success">Success</span></td>
                        <td><strong>${tx.intent.amount} XLM</strong></td>
                        <td>${tx.tx_hash.slice(0, 8)}...</td>
                    </tr>
                `).join('');
            }

            // Update Counts
            document.getElementById('totalTransactions').textContent = data.length;
            document.getElementById('countSuccess').textContent = data.length;
            
            // Update Volume Line Chart
            updateCharts(data.slice(-7));

            // Populate Model comparison from last transaction if available
            if (data.length > 0) {
                const last = data[0];
                const modelBody = document.getElementById('modelComparisonBody');
                if (modelBody) {
                    // Logic would go here to show competing models from the last decision
                    // For now keeping a clean "Real System" feel by showing what led to the last tx
                    modelBody.innerHTML = `
                        <tr>
                            <td>${last.best_model}</td>
                            <td>Optimized</td>
                            <td>Included</td>
                            <td><span class="fw-600">Selected</span></td>
                        </tr>
                    `;
                }
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    fetchData();
    setInterval(fetchData, 30000); // Refresh every 30s
};

document.addEventListener('DOMContentLoaded', initDashboard);
