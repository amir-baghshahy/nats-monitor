# NATS Monitor Helm Chart

This Helm chart deploys the NATS Monitoring application to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- NATS server accessible from the cluster

## Installation

### Add Helm repository (if published)

```bash
helm repo add nats-monitor https://charts.example.com
helm repo update
```

### Install from local directory

```bash
# Build the Docker image first
docker build -t nats-monitor:latest .

# Install the chart
helm install nats-monitor ./helm/nats-monitor
```

### Install with custom values

```bash
helm install nats-monitor ./helm/nats-monitor -f custom-values.yaml
```

## Configuration

The following table lists the configurable parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `nats-monitor` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `ingress.enabled` | Enable ingress | `false` |
| `app.port` | Application port | `3000` |
| `app.natsUrl` | NATS connection URL | `nats://nats:4222` |
| `resources` | Pod resource requests/limits | `{}` |
| `autoscaling.enabled` | Enable HPA | `false` |
| `autoscaling.minReplicas` | Minimum replicas for HPA | `1` |
| `autoscaling.maxReplicas` | Maximum replicas for HPA | `3` |

## Example Values

### Production with Ingress

```yaml
replicaCount: 3
image:
  tag: "v1.0.0"
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: nats-monitor.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nats-monitor-tls
      hosts:
        - nats-monitor.example.com
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi
app:
  natsUrl: "nats://nats.production.svc.cluster.local:4222"
```

### Development

```yaml
replicaCount: 1
service:
  type: NodePort
app:
  corsAllowedOrigins: "*"
  natsUrl: "nats://nats.default.svc.cluster.local:4222"
```

## Upgrading

```bash
helm upgrade nats-monitor ./helm/nats-monitor
```

## Uninstalling

```bash
helm uninstall nats-monitor
```

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=nats-monitor
```

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=nats-monitor --tail=100 -f
```

### Port forward for local access

```bash
kubectl port-forward svc/nats-monitor 8080:3000
# Open http://localhost:8080
```

## Notes

- The chart requires a NATS server to be running and accessible
- Default resource limits are conservative; adjust based on your workload
- Enable HPA for production environments with variable traffic
- Use ingress for external access in production environments
