// Metrics data and display logic
class ResonanceMetrics {
    constructor() {
        this.data = null;
        this.updateInterval = 5000; // 5 seconds
        // Primary: Real-time API endpoint
        this.apiSource = 'https://resonance.syncscript.app/api/metrics';
        // Fallback: Static JSON file
        this.fallbackSource = 'data/metrics.json';
        this.init();
    }

    async init() {
        await this.loadMetrics();
        this.updateDisplay();
        this.startAutoUpdate();
    }

    async loadMetrics() {
        try {
            // PRIMARY: Load from real-time API endpoint
            const apiResponse = await fetch(this.apiSource);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                // Transform API response to match our display format
                this.data = this.transformApiData(apiData);
                this.updateLastUpdated();
                return;
            }
            
            // FALLBACK: Load from static JSON file if API is unavailable
            console.warn('API unavailable, using fallback data');
            const response = await fetch(this.fallbackSource);
            if (response.ok) {
                this.data = await response.json();
                this.updateLastUpdated();
                return;
            }
            
            throw new Error('Both API and fallback failed');
        } catch (error) {
            console.error('Failed to load metrics:', error);
            // No data available - set to null instead of showing fake data
            this.data = null;
            this.updateLastUpdated();
        }
    }

    transformApiData(apiData) {
        // Transform the API response to match our expected format
        // API returns: { R, K, spectralEntropy, mode, coherenceScore, tailHealthScore, timingScore, lambdaRes, gpd, tailQuantiles, p99Latency, p50Latency, ... }
        return {
            R: apiData.R || 0.5,
            K: apiData.K || 0.35,
            spectralEntropy: apiData.spectralEntropy || 0.5,
            mode: apiData.mode || 'adaptive',
            coherenceScore: apiData.coherenceScore,
            tailHealthScore: apiData.tailHealthScore,
            timingScore: apiData.timingScore,
            lambdaRes: apiData.lambdaRes,
            gpd: apiData.gpd,
            tailQuantiles: apiData.tailQuantiles,
            p50Latency: apiData.p50Latency,
            p95Latency: apiData.p95Latency || apiData.p99Latency, // Use p99 as fallback for p95
            p99Latency: apiData.p99Latency,
            p99_9Latency: apiData.p99_9Latency || apiData.tailQuantiles?.q99_9,
            bandCompliance: this.calculateBandCompliance(apiData.R),
            p99Improvement: apiData.p99Improvement || null,
            validation: {
                status: apiData.agentConnected ? 'Online' : 'Offline',
                testsPassed: apiData.validation?.testsPassed || null,
                totalTests: apiData.validation?.totalTests || null,
                coverage: apiData.validation?.coverage || null,
                details: apiData.agentConnected ? 'Connected to Resonance agent' : 'Agent not connected'
            },
            agentStatus: apiData.agentConnected ? 'Online' : 'Offline',
            metricsStatus: apiData.agentConnected ? 'Active' : 'Inactive',
            dataQuality: apiData.agentConnected ? 'Live' : 'Mock',
            lastValidation: apiData.timestamp || new Date().toISOString(),
            timestamp: apiData.timestamp || new Date().toISOString()
        };
    }

    calculateBandCompliance(R) {
        // Calculate what percentage of time R is in the optimal band [0.35, 0.65]
        // For real-time data, this is just a single point, so we return 100% if in band
        if (R >= 0.35 && R <= 0.65) {
            return 100;
        }
        // Could be improved to track historical compliance
        return 0;
    }

    updateDisplay() {
        // Show "No Data" indicators if data is not available
        if (!this.data) {
            this.showNoDataIndicators();
            return;
        }

        // Global Resonance R(t)
        const r = this.data.R !== null && this.data.R !== undefined ? this.data.R : null;
        if (r !== null) {
            document.getElementById('globalR').textContent = r.toFixed(3);
            this.updateRStatus(r);
            this.updateBandIndicator(r);
        } else {
            document.getElementById('globalR').textContent = 'N/A';
            document.getElementById('rStatus').textContent = 'No data';
            document.getElementById('rStatus').style.color = 'var(--text-secondary)';
        }

        // Band Compliance
        const compliance = this.data.bandCompliance !== null && this.data.bandCompliance !== undefined ? this.data.bandCompliance : null;
        if (compliance !== null) {
            document.getElementById('bandCompliance').textContent = `${compliance.toFixed(1)}%`;
            this.updateComplianceStatus(compliance);
        } else {
            document.getElementById('bandCompliance').textContent = 'N/A';
        }

        // Component Scores
        if (this.data.coherenceScore !== null && this.data.coherenceScore !== undefined) {
            const coherence = this.data.coherenceScore;
            document.getElementById('coherenceScore').textContent = `${(coherence * 100).toFixed(1)}%`;
            document.getElementById('coherenceBar').style.width = `${coherence * 100}%`;
        } else {
            document.getElementById('coherenceScore').textContent = 'N/A';
            document.getElementById('coherenceBar').style.width = '0%';
        }

        if (this.data.tailHealthScore !== null && this.data.tailHealthScore !== undefined) {
            const tail = this.data.tailHealthScore;
            document.getElementById('tailHealthScore').textContent = `${(tail * 100).toFixed(1)}%`;
            document.getElementById('tailBar').style.width = `${tail * 100}%`;
        } else {
            document.getElementById('tailHealthScore').textContent = 'N/A';
            document.getElementById('tailBar').style.width = '0%';
        }

        if (this.data.timingScore !== null && this.data.timingScore !== undefined) {
            const timing = this.data.timingScore;
            document.getElementById('timingScore').textContent = `${(timing * 100).toFixed(1)}%`;
            document.getElementById('timingBar').style.width = `${timing * 100}%`;
        } else {
            document.getElementById('timingScore').textContent = 'N/A';
            document.getElementById('timingBar').style.width = '0%';
        }

        if (this.data.lambdaRes !== null && this.data.lambdaRes !== undefined) {
            document.getElementById('lambdaRes').textContent = this.data.lambdaRes.toFixed(3);
        } else {
            document.getElementById('lambdaRes').textContent = 'N/A';
        }

        // GPD Parameters
        if (this.data.gpd) {
            if (this.data.gpd.xi !== null && this.data.gpd.xi !== undefined) {
                document.getElementById('gpdXi').textContent = this.data.gpd.xi.toFixed(4);
            } else {
                document.getElementById('gpdXi').textContent = 'N/A';
            }
            if (this.data.gpd.sigma !== null && this.data.gpd.sigma !== undefined) {
                document.getElementById('gpdSigma').textContent = this.data.gpd.sigma.toFixed(2);
            } else {
                document.getElementById('gpdSigma').textContent = 'N/A';
            }
            if (this.data.gpd.threshold !== null && this.data.gpd.threshold !== undefined) {
                document.getElementById('gpdThreshold').textContent = this.data.gpd.threshold.toFixed(2);
            } else {
                document.getElementById('gpdThreshold').textContent = 'N/A';
            }
        } else {
            document.getElementById('gpdXi').textContent = 'N/A';
            document.getElementById('gpdSigma').textContent = 'N/A';
            document.getElementById('gpdThreshold').textContent = 'N/A';
        }

        // Tail Quantiles
        if (this.data.tailQuantiles) {
            if (this.data.tailQuantiles.q99 !== null && this.data.tailQuantiles.q99 !== undefined) {
                document.getElementById('tailQ99').textContent = this.data.tailQuantiles.q99.toFixed(2);
            } else {
                document.getElementById('tailQ99').textContent = 'N/A';
            }
            if (this.data.tailQuantiles.q99_9 !== null && this.data.tailQuantiles.q99_9 !== undefined) {
                document.getElementById('tailQ99_9').textContent = this.data.tailQuantiles.q99_9.toFixed(2);
            } else {
                document.getElementById('tailQ99_9').textContent = 'N/A';
            }
        } else {
            document.getElementById('tailQ99').textContent = 'N/A';
            document.getElementById('tailQ99_9').textContent = 'N/A';
        }

        // Performance Metrics
        if (this.data.p50Latency !== null && this.data.p50Latency !== undefined) {
            document.getElementById('p50Latency').textContent = Math.round(this.data.p50Latency);
        } else {
            document.getElementById('p50Latency').textContent = 'N/A';
        }
        if (this.data.p95Latency !== null && this.data.p95Latency !== undefined) {
            document.getElementById('p95Latency').textContent = Math.round(this.data.p95Latency);
        } else {
            document.getElementById('p95Latency').textContent = 'N/A';
        }
        if (this.data.p99Latency !== null && this.data.p99Latency !== undefined) {
            document.getElementById('p99Latency').textContent = Math.round(this.data.p99Latency);
        } else {
            document.getElementById('p99Latency').textContent = 'N/A';
        }
        if (this.data.p99_9Latency !== null && this.data.p99_9Latency !== undefined) {
            document.getElementById('p99_9Latency').textContent = Math.round(this.data.p99_9Latency);
        } else {
            document.getElementById('p99_9Latency').textContent = 'N/A';
        }
        if (this.data.spectralEntropy !== undefined && this.data.spectralEntropy !== null) {
            document.getElementById('spectralEntropy').textContent = this.data.spectralEntropy.toFixed(3);
        } else {
            document.getElementById('spectralEntropy').textContent = 'N/A';
        }
        if (this.data.K !== undefined && this.data.K !== null) {
            document.getElementById('couplingK').textContent = this.data.K.toFixed(3);
        } else {
            document.getElementById('couplingK').textContent = 'N/A';
        }

        // P99 Improvement
        if (this.data.p99Improvement !== undefined && this.data.p99Improvement !== null) {
            const improvement = this.data.p99Improvement;
            const improvementEl = document.getElementById('p99Improvement');
            improvementEl.textContent = `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`;
            improvementEl.style.color = improvement > 0 ? 'var(--success-color)' : 'var(--danger-color)';
        } else {
            document.getElementById('p99Improvement').textContent = 'N/A';
            document.getElementById('p99Improvement').style.color = 'var(--text-secondary)';
        }

        // Validation Status
        if (this.data.validation) {
            if (this.data.validation.status) {
                document.getElementById('validationStatus').textContent = this.data.validation.status;
            } else {
                document.getElementById('validationStatus').textContent = 'N/A';
            }
            if (this.data.validation.details) {
                document.getElementById('validationDetails').textContent = this.data.validation.details;
            } else {
                document.getElementById('validationDetails').textContent = 'No data available';
            }
            if (this.data.validation.testsPassed !== undefined && this.data.validation.testsPassed !== null) {
                document.getElementById('testsPassed').textContent = this.data.validation.testsPassed;
            } else {
                document.getElementById('testsPassed').textContent = 'N/A';
            }
            if (this.data.validation.totalTests !== undefined && this.data.validation.totalTests !== null) {
                document.getElementById('totalTests').textContent = this.data.validation.totalTests;
            } else {
                document.getElementById('totalTests').textContent = 'N/A';
            }
            if (this.data.validation.coverage) {
                document.getElementById('testCoverage').textContent = this.data.validation.coverage;
            } else {
                document.getElementById('testCoverage').textContent = 'N/A';
            }
        } else {
            document.getElementById('validationStatus').textContent = 'N/A';
            document.getElementById('validationDetails').textContent = 'No data available';
            document.getElementById('testsPassed').textContent = 'N/A';
            document.getElementById('totalTests').textContent = 'N/A';
            document.getElementById('testCoverage').textContent = 'N/A';
        }

        // System Health
        if (this.data.agentStatus) {
            document.getElementById('agentStatus').textContent = this.data.agentStatus;
        } else {
            document.getElementById('agentStatus').textContent = 'N/A';
        }
        if (this.data.metricsStatus) {
            document.getElementById('metricsStatus').textContent = this.data.metricsStatus;
        } else {
            document.getElementById('metricsStatus').textContent = 'N/A';
        }
        if (this.data.dataQuality) {
            document.getElementById('dataQuality').textContent = this.data.dataQuality;
        } else {
            document.getElementById('dataQuality').textContent = 'N/A';
        }

        // Last Validation
        if (this.data.lastValidation) {
            document.getElementById('lastValidation').textContent = new Date(this.data.lastValidation).toLocaleString();
        } else {
            document.getElementById('lastValidation').textContent = 'N/A';
        }
    }

    updateRStatus(r) {
        const statusEl = document.getElementById('rStatus');
        if (r >= 0.35 && r <= 0.65) {
            statusEl.textContent = '✓ Optimal';
            statusEl.style.color = 'var(--success-color)';
        } else if (r < 0.35) {
            statusEl.textContent = '⚠ Low';
            statusEl.style.color = 'var(--warning-color)';
        } else {
            statusEl.textContent = '⚠ High';
            statusEl.style.color = 'var(--warning-color)';
        }
    }

    updateBandIndicator(r) {
        const indicator = document.getElementById('bandIndicator');
        // Visual indicator for R position in band
        const position = Math.max(0, Math.min(100, ((r - 0) / 1) * 100));
        indicator.style.setProperty('--r-position', `${position}%`);
    }

    updateComplianceStatus(compliance) {
        const statusEl = document.getElementById('bandCompliance');
        if (compliance >= 85) {
            statusEl.style.color = 'var(--success-color)';
        } else if (compliance >= 70) {
            statusEl.style.color = 'var(--warning-color)';
        } else {
            statusEl.style.color = 'var(--danger-color)';
        }
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleString();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.loadMetrics();
            this.updateDisplay();
        }, this.updateInterval);
    }

    showNoDataIndicators() {
        // Show "N/A" or "-" for all metrics when no data is available
        document.getElementById('globalR').textContent = 'N/A';
        document.getElementById('rStatus').textContent = 'No data available';
        document.getElementById('rStatus').style.color = 'var(--text-secondary)';
        document.getElementById('bandCompliance').textContent = 'N/A';
        document.getElementById('p99Improvement').textContent = 'N/A';
        document.getElementById('validationStatus').textContent = 'N/A';
        document.getElementById('validationDetails').textContent = 'Unable to load data';
        
        document.getElementById('coherenceScore').textContent = 'N/A';
        document.getElementById('tailHealthScore').textContent = 'N/A';
        document.getElementById('timingScore').textContent = 'N/A';
        document.getElementById('lambdaRes').textContent = 'N/A';
        
        document.getElementById('gpdXi').textContent = 'N/A';
        document.getElementById('gpdSigma').textContent = 'N/A';
        document.getElementById('gpdThreshold').textContent = 'N/A';
        document.getElementById('tailQ99').textContent = 'N/A';
        document.getElementById('tailQ99_9').textContent = 'N/A';
        
        document.getElementById('p50Latency').textContent = 'N/A';
        document.getElementById('p95Latency').textContent = 'N/A';
        document.getElementById('p99Latency').textContent = 'N/A';
        document.getElementById('p99_9Latency').textContent = 'N/A';
        document.getElementById('spectralEntropy').textContent = 'N/A';
        document.getElementById('couplingK').textContent = 'N/A';
        
        document.getElementById('testsPassed').textContent = 'N/A';
        document.getElementById('totalTests').textContent = 'N/A';
        document.getElementById('testCoverage').textContent = 'N/A';
        document.getElementById('agentStatus').textContent = 'N/A';
        document.getElementById('metricsStatus').textContent = 'N/A';
        document.getElementById('dataQuality').textContent = 'No data';
        document.getElementById('lastValidation').textContent = 'N/A';
        
        // Reset progress bars
        document.getElementById('coherenceBar').style.width = '0%';
        document.getElementById('tailBar').style.width = '0%';
        document.getElementById('timingBar').style.width = '0%';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.metrics = new ResonanceMetrics();
});

