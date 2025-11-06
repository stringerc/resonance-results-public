# Resonance Results Public

Public results page for Resonance Calculus performance metrics and validation results.

**Live Site**: https://stringerc.github.io/resonance-results-public/

## Overview

This repository hosts a GitHub Pages site displaying real-time Resonance Calculus metrics, including:

- **Global Resonance R(t)** measurements with optimal band visualization
- **Component breakdown** (Coherence, Tail Health, Timing scores)
- **Tail health analysis** (GPD parameters, Q99/Q99.9 quantiles)
- **Performance metrics** (P50, P95, P99, P99.9 latencies)
- **Validation results** and test coverage
- **Historical charts** with time range selection

## Features

- 📊 Real-time metrics display (updates every 5 seconds)
- 📈 Interactive charts with Chart.js
- 🎯 Band compliance tracking (target: [0.35, 0.65])
- 📉 Historical data visualization (1h, 24h, 7d, 30d)
- ✅ Validation status and test coverage
- 📱 Responsive design for mobile and desktop

## Data Source

Metrics are loaded from `data/metrics.json` which can be:

1. **Manually updated** - Edit the JSON file and commit
2. **Auto-generated** - From agent metrics export
3. **API endpoint** - Point to `https://resonance.syncscript.app/api/metrics` (uncomment in `metrics.js`)

## Updating Results

### Manual Update

1. Edit `data/metrics.json` with latest metrics
2. Commit and push to `main` branch:
   ```bash
   git add data/metrics.json
   git commit -m "Update metrics"
   git push
   ```
3. GitHub Pages will auto-deploy (usually within 1-2 minutes)

### Automated Update

To automatically sync with your Resonance agent:

1. Set up a cron job or GitHub Action to fetch metrics
2. Update `data/metrics.json` programmatically
3. Commit and push changes

Example GitHub Action (`.github/workflows/update-metrics.yml`):
```yaml
name: Update Metrics
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch metrics
        run: |
          curl -o data/metrics.json https://resonance.syncscript.app/api/metrics
      - name: Commit
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/metrics.json
          git commit -m "Auto-update metrics" || exit 0
          git push
```

## Local Development

### Option 1: Python HTTP Server

```bash
# Navigate to repository
cd resonance-results-public

# Start server
python3 -m http.server 8000

# Open http://localhost:8000
```

### Option 2: Node.js Serve

```bash
# Install serve globally
npm install -g serve

# Start server
serve .

# Open http://localhost:3000
```

## Project Structure

```
resonance-results-public/
├── index.html              # Main results page
├── README.md               # This file
├── data/
│   └── metrics.json        # Metrics data (update this)
├── assets/
│   ├── css/
│   │   └── style.css       # Styles
│   ├── js/
│   │   ├── metrics.js      # Metrics display logic
│   │   └── charts.js       # Chart rendering
│   └── images/             # Images/logos (optional)
└── .github/
    └── workflows/          # GitHub Actions (optional)
```

## License

This project is part of the Resonance Calculus framework.

## Links

- **Main Dashboard**: https://resonance.syncscript.app
- **GitHub Repository**: https://github.com/stringerc/resonance-results-public

