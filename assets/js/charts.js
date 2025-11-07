// Chart rendering with Chart.js
class ResonanceCharts {
    constructor(metrics) {
        this.metrics = metrics;
        this.rChart = null;
        this.componentsChart = null;
        this.history = [];
        this.currentTimeRange = '1h';
        this.statusEl = null;
        this.init();
    }

    init() {
        this.initRChart();
        this.initComponentsChart();
        this.initTimeRangeButtons();
        this.statusEl = document.getElementById('timeRangeStatus');
        this.startHistoryUpdate();
    }

    initRChart() {
        const ctx = document.getElementById('rChart').getContext('2d');
        
        this.rChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'R(t)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `R(t): ${context.parsed.y.toFixed(3)}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            optimalBand: {
                                type: 'box',
                                yMin: 0.35,
                                yMax: 0.65,
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                                borderWidth: 1
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 1,
                        ticks: {
                            stepSize: 0.1,
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }

    initComponentsChart() {
        const ctx = document.getElementById('componentsChart').getContext('2d');
        
        this.componentsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Coherence Score',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Tail Health Score',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Timing Score',
                        data: [],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 1,
                        ticks: {
                            stepSize: 0.1,
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }

    initTimeRangeButtons() {
        const buttons = document.querySelectorAll('.time-range-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTimeRange = btn.dataset.range;
                this.filterHistory();
            });
        });
    }

    filterHistory() {
        if (!this.rChart || this.history.length === 0) {
            this.updateRChartWithHistory([]);
            return;
        }

        const now = Date.now();
        let cutoffTime;
        
        switch (this.currentTimeRange) {
            case '1h':
                cutoffTime = now - (60 * 60 * 1000);
                break;
            case '24h':
                cutoffTime = now - (24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffTime = now - (60 * 60 * 1000);
        }

        const filtered = this.history.filter(item => item.timestamp >= cutoffTime);
        this.updateRChartWithHistory(filtered);
    }

    rangeLabel() {
        switch (this.currentTimeRange) {
            case '1h':
                return 'the last hour';
            case '24h':
                return 'the last 24 hours';
            case '7d':
                return 'the last 7 days';
            case '30d':
                return 'the last 30 days';
            default:
                return 'the selected range';
        }
    }

    setStatus(message) {
        if (!this.statusEl) return;
        if (message) {
            this.statusEl.textContent = message;
            this.statusEl.classList.remove('hidden');
        } else {
            this.statusEl.textContent = '';
            this.statusEl.classList.add('hidden');
        }
    }

    updateRChartWithHistory(historyData) {
        if (!this.rChart) return;

        if (!historyData || historyData.length === 0) {
            this.rChart.data.labels = [];
            this.rChart.data.datasets[0].data = [];
            this.rChart.update('none');
            if (this.history.length === 0) {
                this.setStatus('Waiting for live data...');
            } else {
                this.setStatus(`Not enough data collected yet to display ${this.rangeLabel()}.`);
            }
            return;
        }

        this.setStatus('');

        // Aggregate data for longer time ranges
        let labels = [];
        let data = [];

        if (this.currentTimeRange === '1h' || this.currentTimeRange === '24h') {
            // Show all points for short ranges
            labels = historyData.map(item => new Date(item.timestamp).toLocaleTimeString());
            data = historyData.map(item => item.R);
        } else {
            // Aggregate for longer ranges
            const buckets = {};
            const bucketSize = this.currentTimeRange === '7d' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 1h or 6h buckets
            
            historyData.forEach(item => {
                const bucket = Math.floor(item.timestamp / bucketSize) * bucketSize;
                if (!buckets[bucket]) {
                    buckets[bucket] = { sum: 0, count: 0 };
                }
                buckets[bucket].sum += item.R;
                buckets[bucket].count += 1;
            });

            Object.keys(buckets).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bucket => {
                const avg = buckets[bucket].sum / buckets[bucket].count;
                labels.push(new Date(parseInt(bucket)).toLocaleString());
                data.push(avg);
            });
        }

        this.rChart.data.labels = labels;
        this.rChart.data.datasets[0].data = data;
        this.rChart.update('none');
    }

    updateCharts(data) {
        if (!data) return;

        const now = Date.now();
        const timestamp = now;

        // Add to history
        this.history.push({
            timestamp: now,
            R: data.R || 0.5,
            coherenceScore: data.coherenceScore,
            tailHealthScore: data.tailHealthScore,
            timingScore: data.timingScore
        });

        // Keep last 1000 points
        if (this.history.length > 1000) {
            this.history.shift();
        }

        // Update R(t) chart with filtered history
        this.filterHistory();

        // Update components chart
        if (this.componentsChart) {
            const timeLabel = new Date(now).toLocaleTimeString();
            
            // Add new data point
            if (this.componentsChart.data.labels.length === 0 || 
                this.componentsChart.data.labels[this.componentsChart.data.labels.length - 1] !== timeLabel) {
                this.componentsChart.data.labels.push(timeLabel);
            }

            if (data.coherenceScore !== null && data.coherenceScore !== undefined) {
                this.componentsChart.data.datasets[0].data.push(data.coherenceScore);
                if (this.componentsChart.data.datasets[0].data.length > 100) {
                    this.componentsChart.data.datasets[0].data.shift();
                }
            }

            if (data.tailHealthScore !== null && data.tailHealthScore !== undefined) {
                this.componentsChart.data.datasets[1].data.push(data.tailHealthScore);
                if (this.componentsChart.data.datasets[1].data.length > 100) {
                    this.componentsChart.data.datasets[1].data.shift();
                }
            }

            if (data.timingScore !== null && data.timingScore !== undefined) {
                this.componentsChart.data.datasets[2].data.push(data.timingScore);
                if (this.componentsChart.data.datasets[2].data.length > 100) {
                    this.componentsChart.data.datasets[2].data.shift();
                }
            }

            // Trim labels to match data length
            const maxLength = Math.max(
                this.componentsChart.data.datasets[0].data.length,
                this.componentsChart.data.datasets[1].data.length,
                this.componentsChart.data.datasets[2].data.length
            );
            if (this.componentsChart.data.labels.length > maxLength) {
                this.componentsChart.data.labels = this.componentsChart.data.labels.slice(-maxLength);
            }

            this.componentsChart.update('none');
        }
    }

    startHistoryUpdate() {
        // Update charts when metrics update
        setInterval(() => {
            if (window.metrics && window.metrics.data) {
                this.updateCharts(window.metrics.data);
            }
        }, 5000);
    }
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for metrics to initialize
    setTimeout(() => {
        if (window.metrics) {
            window.charts = new ResonanceCharts(window.metrics);
        }
    }, 1000);
});

