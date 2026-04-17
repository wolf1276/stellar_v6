import Chart from 'chart.js/auto';

const initDashboard = () => {
    if (!document.querySelector('[data-dashboard]')) return;

    // --- KPI Donut Chart ---
    const donutCtx = document.getElementById('transactionDonut');
    if (donutCtx) {
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [293, 161, 117],
                    backgroundColor: ['#10b981', '#6366f1', '#ef4444'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                }]
            },
            options: {
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    // --- Volume Line Chart ---
    const lineCtx = document.getElementById('volumeChart');
    if (lineCtx) {
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Volume',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: true,
                    borderColor: '#ff6849',
                    backgroundColor: 'rgba(255, 104, 73, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { display: false },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    // --- Confidence Grid / Bars ---
    const gridCtx = document.getElementById('confidenceGrid');
    if (gridCtx) {
        new Chart(gridCtx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
                datasets: [{
                    data: [40, 50, 45, 60, 55, 70, 65, 80],
                    backgroundColor: '#6366f1',
                    borderRadius: 5,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                }
            }
        });
    }

    // --- Populate Tables ---
    const transactions = [
        { type: 'Payment', status: 'Success', amount: '1,207 XLM', time: '2 mins ago' },
        { type: 'Escrow', status: 'Pending', amount: '73 XLM', time: '15 mins ago' },
        { type: 'Swap', status: 'Failed', amount: '10.75 XLM', time: '1 hour ago' },
    ];

    const txBody = document.getElementById('transactionTableBody');
    if (txBody) {
        txBody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${tx.type}</td>
                <td><span class="badge rounded-pill text-bg-${tx.status === 'Success' ? 'success' : tx.status === 'Pending' ? 'info' : 'danger'}">${tx.status}</span></td>
                <td><strong>${tx.amount}</strong></td>
                <td>${tx.time}</td>
            </tr>
        `).join('');
    }

    const models = [
        { name: 'GPT-4o', output: '100.2', fee: '0.01', confidence: '92%' },
        { name: 'Claude-3.5', output: '100.1', fee: '0.005', confidence: '89%' },
        { name: 'Llama-3', output: '99.8', fee: '0.012', confidence: '85%' },
    ];

    const modelBody = document.getElementById('modelComparisonBody');
    if (modelBody) {
        modelBody.innerHTML = models.map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.output}</td>
                <td>${m.fee}</td>
                <td><span class="fw-600">${m.confidence}</span></td>
            </tr>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', initDashboard);
