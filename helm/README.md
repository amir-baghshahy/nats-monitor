# NATS Horizon Helm Chart

This Helm chart deploys the NATS Horizon application to Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- NATS server accessible from the cluster

## Installation

### Add Helm repository (if published)

```bash
helm repo add nats-horizon https://charts.example.com
helm repo update
```

### Install from local directory

```bash
# Build the Docker image first
docker build -t nats-horizon:latest .

# Install the chart
helm install nats-horizon ./helm/nats-horizon
```

### Install with custom values

```bash
helm install nats-horizon ./helm/nats-horizon -f custom-values.yaml
```

## Configuration

The following table lists the configurable parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `nats-horizon` |
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
    - host: nats-horizon.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nats-horizon-tls
      hosts:
        - nats-horizon.example.com
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
helm upgrade nats-horizon ./helm/nats-horizon
```

## Uninstalling

```bash
helm uninstall nats-horizon
```

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=nats-horizon
```

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=nats-horizon --tail=100 -f
```

### Port forward for local access

```bash
kubectl port-forward svc/nats-horizon 8080:3000
# Open http://localhost:8080
```

## Notes

- The chart requires a NATS server to be running and accessible
- Default resource limits are conservative; adjust based on your workload
- Enable HPA for production environments with variable traffic
- Use ingress for external access in production environments
