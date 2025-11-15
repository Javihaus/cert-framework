"""
Dashboard CLI Commands
======================

Commands for running and managing the CERT dashboard.
"""

import sys
from pathlib import Path

import click


@click.command()
@click.option(
    "--output",
    "-o",
    default="cert_dashboard.html",
    help="Output HTML file path",
)
@click.option(
    "--traces",
    "-t",
    default="cert_traces.jsonl",
    help="Path to traces file",
)
def dashboard(output: str, traces: str):
    """
    Generate a static HTML dashboard from traces.

    This creates a standalone HTML file with embedded data that can be
    opened in any browser.

    Example:
        cert dashboard
        cert dashboard --traces production.jsonl --output prod_dashboard.html
    """
    traces_path = Path(traces)

    if not traces_path.exists():
        click.echo(f"Error: Traces file not found: {traces}", err=True)
        sys.exit(1)

    click.echo(f"Generating dashboard from {traces}...")

    # Read traces
    import json

    trace_data = []
    with open(traces_path) as f:
        for line in f:
            if line.strip():
                trace_data.append(json.loads(line))

    # Generate HTML with embedded data
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CERT Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        h1 {{
            color: #1a365d;
            margin-bottom: 10px;
        }}
        .subtitle {{
            color: #718096;
            margin-bottom: 30px;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .metric-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .metric-value {{
            font-size: 2rem;
            font-weight: bold;
            color: #2563eb;
        }}
        .metric-label {{
            color: #718096;
            font-size: 0.875rem;
            margin-top: 5px;
        }}
        .chart-container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        table {{
            width: 100%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        th, td {{
            padding: 12px;
            text-align: left;
        }}
        th {{
            background: #f7fafc;
            color: #1a365d;
            font-weight: 600;
        }}
        tr:nth-child(even) {{
            background: #f7fafc;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>CERT Dashboard</h1>
        <p class="subtitle">Generated from {len(trace_data)} traces</p>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value" id="total-traces">{len(trace_data)}</div>
                <div class="metric-label">Total Traces</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="total-cost">$0.00</div>
                <div class="metric-label">Total Cost</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="avg-cost">$0.00</div>
                <div class="metric-label">Avg Cost per Request</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="unique-models">0</div>
                <div class="metric-label">Unique Models</div>
            </div>
        </div>

        <div class="chart-container">
            <h2>Cost Trend</h2>
            <canvas id="costChart"></canvas>
        </div>

        <div class="chart-container">
            <h2>Cost by Model</h2>
            <table id="model-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Requests</th>
                        <th>Total Cost</th>
                        <th>Avg Cost</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>

    <script>
        const traces = {json.dumps(trace_data)};

        // Calculate metrics
        const totalCost = traces.reduce((sum, t) => sum + (t.cost || 0), 0);
        const avgCost = traces.length > 0 ? totalCost / traces.length : 0;
        const models = new Set(traces.map(t => t.model).filter(Boolean));

        document.getElementById('total-cost').textContent = '$' + totalCost.toFixed(4);
        document.getElementById('avg-cost').textContent = '$' + avgCost.toFixed(6);
        document.getElementById('unique-models').textContent = models.size;

        // Cost trend chart
        const dailyCosts = {{}};
        traces.forEach(t => {{
            const date = t.timestamp ? t.timestamp.split('T')[0] : 'unknown';
            dailyCosts[date] = (dailyCosts[date] || 0) + (t.cost || 0);
        }});

        const dates = Object.keys(dailyCosts).sort();
        const costs = dates.map(d => dailyCosts[d]);

        new Chart(document.getElementById('costChart'), {{
            type: 'line',
            data: {{
                labels: dates,
                datasets: [{{
                    label: 'Daily Cost',
                    data: costs,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }}
            }}
        }});

        // Model table
        const byModel = {{}};
        traces.forEach(t => {{
            const model = t.model || 'unknown';
            if (!byModel[model]) {{
                byModel[model] = {{ count: 0, cost: 0 }};
            }}
            byModel[model].count++;
            byModel[model].cost += t.cost || 0;
        }});

        const tbody = document.querySelector('#model-table tbody');
        Object.entries(byModel)
            .sort((a, b) => b[1].cost - a[1].cost)
            .forEach(([model, data]) => {{
                const row = tbody.insertRow();
                row.insertCell().textContent = model;
                row.insertCell().textContent = data.count;
                row.insertCell().textContent = '$' + data.cost.toFixed(4);
                row.insertCell().textContent = '$' + (data.cost / data.count).toFixed(6);
            }});
    </script>
</body>
</html>
    """

    # Write HTML file
    output_path = Path(output)
    with open(output_path, "w") as f:
        f.write(html_content)

    click.echo(f"✓ Dashboard generated: {output_path}")
    click.echo(f"  Open in browser: file://{output_path.absolute()}")


@click.command()
@click.option(
    "--host",
    "-h",
    default="127.0.0.1",
    help="Host to bind to",
)
@click.option(
    "--port",
    "-p",
    default=8000,
    type=int,
    help="Port to bind to",
)
@click.option(
    "--reload",
    is_flag=True,
    help="Enable auto-reload (development mode)",
)
def serve(host: str, port: int, reload: bool):
    """
    Start the CERT API server for self-hosted dashboard.

    This starts a FastAPI server that provides real-time access to
    connector status, cost analytics, and optimization recommendations.

    Example:
        cert serve                    # Start on localhost:8000
        cert serve --port 9000        # Custom port
        cert serve --host 0.0.0.0     # Bind to all interfaces
        cert serve --reload           # Enable auto-reload
    """
    try:
        import uvicorn
    except ImportError:
        click.echo(
            "Error: FastAPI and uvicorn required for API server.\n"
            "Install with: pip install 'cert-framework[api]'",
            err=True,
        )
        sys.exit(1)

    click.echo("Starting CERT API server...")
    click.echo(f"  Host: {host}")
    click.echo(f"  Port: {port}")
    click.echo(f"  API docs: http://{host}:{port}/docs")
    click.echo("\nFor dashboard integration:")
    click.echo(f"  export NEXT_PUBLIC_CERT_API=http://{host}:{port}")
    click.echo("  cd dashboard && npm run dev")
    click.echo("")

    uvicorn.run(
        "cert.api.server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
