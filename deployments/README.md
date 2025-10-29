# Deployment Configurations

This directory contains deployment configurations for advanced/experimental CERT Framework features.

## ⚠️ Status: Legacy Configurations

These configurations are from previous versions and are designed for **advanced/experimental features**:
- Coordination monitoring
- Trajectory analysis (Hamiltonian monitoring)
- Prometheus metrics export
- Grafana dashboards

## v4.0 Architecture

For the new v4.0 lightweight architecture, use the **root-level deployment files**:

### Recommended for v4.0:

1. **`/Dockerfile`** - Modern, lightweight Dockerfile
   - Core only: ~50MB
   - With evaluation: ~500MB
   - Supports build args for extras

2. **`/docker-compose.yml`** - Complete monitoring stack
   - Core monitoring service
   - Evaluation service (periodic)
   - Compliance report generator

### Quick Start (v4.0):

```bash
# Build core image
docker build -t cert-framework:core .

# Build with evaluation
docker build --build-arg EXTRAS=evaluation -t cert-framework:eval .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f cert-core

# Run evaluation manually
docker-compose exec cert-evaluator cert evaluate /var/log/cert/traces.jsonl

# Generate compliance report
docker-compose exec cert-reporter cert report /var/log/cert/traces.jsonl \
  -o /app/reports/report.md --system-name "My System"
```

## Legacy Configurations (This Directory)

The configurations in this directory are for:

### `docker/`
- `Dockerfile.coordination` - For coordination monitoring (experimental)
- `Dockerfile.hamiltonian` - For trajectory analysis (experimental)
- `docker-compose.yml` - Old full-stack setup

### `kubernetes/`
- K8s deployments for advanced features
- Requires updating for v4.0 architecture

### `prometheus/`
- Metrics scraping configuration
- Works with `[observability]` extras

### `grafana/`
- Dashboard configurations
- Requires Prometheus setup

## Migration Notes

If you're using these legacy configurations:

1. **For basic monitoring**: Use the new root-level `Dockerfile` and `docker-compose.yml`
2. **For advanced features**: These configs may need updating for v4.0:
   - Update base images
   - Update dependency installation
   - Add extras as needed (`[evaluation]`, `[trajectory]`, etc.)

## Future Plans

- [ ] Update Kubernetes configs for v4.0 architecture
- [ ] Modernize Prometheus/Grafana integration
- [ ] Create Helm charts for easy K8s deployment
- [ ] Add examples for cloud platforms (AWS, GCP, Azure)

## Questions?

See the main documentation: https://github.com/Javihaus/cert-framework
