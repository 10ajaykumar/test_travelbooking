# Travel Booking GitOps Helm Charts

This folder contains the production-style GitOps deployment configuration for the Travel Booking microservices platform.

The application services are deployed as independent Helm releases. Shared Kubernetes patterns are reused through a small Helm library chart.

## Directory Structure

```text
travel-booking-gitops/
  charts/
    common/
    infra/
    gateway-api/
    frontend/
    user-service/
    search-service/
    booking-service/
    payment-service/
    notification-service/
  environments/
    dev/
    staging/
    prod/
  argocd/
    gateway-api.yaml
    frontend.yaml
    user-service.yaml
    search-service.yaml
    booking-service.yaml
    payment-service.yaml
    notification-service.yaml
```

## Chart Design

Each microservice has its own chart:

```text
frontend
user-service
search-service
booking-service
payment-service
notification-service
```

Each service gets its own:

- Helm release
- Argo CD Application
- image repository and tag
- replicas
- resources
- HPA
- PDB
- NetworkPolicy
- ServiceAccount
- ConfigMap
- deployment lifecycle

`charts/common` is a Helm library chart. It provides reusable templates for common Kubernetes resources:

- Deployment
- Service
- ServiceAccount
- ConfigMap
- HPA
- PDB
- NetworkPolicy
- ExternalSecret support

`infra` is for local and environment infrastructure wiring. For Kind/dev it can deploy:

- PostgreSQL StatefulSet and Service
- Redis Deployment and Service
- local placeholder Kubernetes Secrets

For staging/prod cloud values, in-cluster Postgres and Redis are disabled by default. Production should normally use managed infrastructure such as RDS, ElastiCache, and External Secrets Operator.

`charts/gateway-api` is separate from the service charts. It deploys:

- `Gateway`
- `HTTPRoute` for `/`
- `HTTPRoute` for `/api/users`
- `HTTPRoute` for `/api/search`
- `HTTPRoute` for `/api/bookings`
- `HTTPRoute` for `/api/payments`
- `HTTPRoute` for `/api/notifications`

It does not create `GatewayClass`. `GatewayClass` must come from infrastructure.

## Service Ports

These ports come from the application code and Dockerfiles:

| Service | Port | Health Path |
|---|---:|---|
| frontend | 80 | `/` |
| user-service | 3001 | `/health` |
| search-service | 3002 | `/health` |
| booking-service | 3003 | `/health` |
| payment-service | 3004 | `/health` |
| notification-service | 3005 | `/health` |

## Image Contract

Jenkins should update only the changed service values file:

```text
environments/${DEPLOY_ENV}/${service}/values.yaml
```

The required image fields are:

```yaml
image:
  repository: 041124309752.dkr.ecr.us-east-1.amazonaws.com/travel-booking-payment-service
  tag: "immutable-tag"
```

Do not use `latest` for production. Use a Git SHA, release tag, or build-number plus SHA.

## Infrastructure Prerequisites

These charts do not deploy infrastructure such as Redis, PostgreSQL, GatewayClass, metrics-server, or External Secrets Operator.

Required infrastructure:

- Kubernetes cluster, Kind for local or EKS/GKE for cloud
- Helm 3
- PostgreSQL reachable by backend services
- Redis reachable by `search-service` and `notification-service`
- Kubernetes Secrets or External Secrets for database/JWT/SMTP values
- metrics-server if HPA is enabled
- Gateway API CRDs and Gateway controller if using `gateway-api`
- Existing `GatewayClass` matching `gateway.gatewayClassName`

For production, prefer managed services:

- PostgreSQL: AWS RDS or equivalent
- Redis: AWS ElastiCache or equivalent
- Secrets: AWS Secrets Manager with External Secrets Operator

## Build Local Images for Kind

From the application repository root, build all service images:

```bash
docker build -t travel-booking-frontend:kind-local frontend
docker build -t travel-booking-user-service:kind-local user-service
docker build -t travel-booking-search-service:kind-local search-service
docker build -t travel-booking-booking-service:kind-local booking-service
docker build -t travel-booking-payment-service:kind-local payment-service
docker build -t travel-booking-notification-service:kind-local notification-service
```

Load images into Kind:

```bash
kind load docker-image travel-booking-frontend:kind-local --name k8s
kind load docker-image travel-booking-user-service:kind-local --name k8s
kind load docker-image travel-booking-search-service:kind-local --name k8s
kind load docker-image travel-booking-booking-service:kind-local --name k8s
kind load docker-image travel-booking-payment-service:kind-local --name k8s
kind load docker-image travel-booking-notification-service:kind-local --name k8s
```

If `kind load docker-image` fails with a containerd config version error, stream the images directly into every Kind node:

```powershell
$images = @(
  'travel-booking-frontend:kind-local',
  'travel-booking-user-service:kind-local',
  'travel-booking-search-service:kind-local',
  'travel-booking-booking-service:kind-local',
  'travel-booking-payment-service:kind-local',
  'travel-booking-notification-service:kind-local'
)
$nodes = @('k8s-control-plane','k8s-worker','k8s-worker2')
foreach ($image in $images) {
  foreach ($node in $nodes) {
    cmd /c "docker save $image | docker exec -i $node ctr -n k8s.io images import -"
  }
}
```

The dev values already point to these local images:

```yaml
image:
  repository: travel-booking-user-service
  tag: kind-local
```

## Local Kind Setup

Create namespace:

```bash
kind export kubeconfig --name k8s
kubectl create namespace travel-booking-dev
```

Install local infra with the included infra chart:

```bash
cd travel-booking-gitops
helm upgrade --install infra infra -n travel-booking-dev -f environments/dev/infra/values.yaml
kubectl rollout status deployment/redis -n travel-booking-dev
kubectl rollout status statefulset/postgres -n travel-booking-dev
```

Alternative: install PostgreSQL and Redis using Bitnami instead of the included infra chart:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install postgres bitnami/postgresql \
  -n travel-booking-dev \
  --set auth.username=postgres \
  --set auth.password=postgres \
  --set auth.database=postgres

helm upgrade --install redis bitnami/redis \
  -n travel-booking-dev \
  --set architecture=standalone \
  --set auth.enabled=false
```

If service names differ, update these values:

```yaml
DB_HOST: postgres
REDIS_HOST: redis-master
```

## Helm Dependency Update

Run from this folder:

```bash
cd travel-booking-gitops
```

Update dependencies:

```bash
helm dependency update charts/frontend
helm dependency update charts/user-service
helm dependency update charts/search-service
helm dependency update charts/booking-service
helm dependency update charts/payment-service
helm dependency update charts/notification-service
```

`gateway-api` has no chart dependencies.

## Helm Lint

```bash
helm lint infra
helm lint charts/frontend
helm lint charts/user-service
helm lint charts/search-service
helm lint charts/booking-service
helm lint charts/payment-service
helm lint charts/notification-service
helm lint charts/gateway-api
```

## Helm Template

Render dev manifests:

```bash
helm template infra infra -n travel-booking-dev -f environments/dev/infra/values.yaml
helm template frontend charts/frontend -n travel-booking-dev -f environments/dev/frontend/values.yaml
helm template user-service charts/user-service -n travel-booking-dev -f environments/dev/user-service/values.yaml
helm template search-service charts/search-service -n travel-booking-dev -f environments/dev/search-service/values.yaml
helm template booking-service charts/booking-service -n travel-booking-dev -f environments/dev/booking-service/values.yaml
helm template payment-service charts/payment-service -n travel-booking-dev -f environments/dev/payment-service/values.yaml
helm template notification-service charts/notification-service -n travel-booking-dev -f environments/dev/notification-service/values.yaml
helm template gateway-api charts/gateway-api -n travel-booking-dev -f environments/dev/gateway-api/values.yaml
```

Render prod manifests:

```bash
helm template frontend charts/frontend -n travel-booking-prod -f environments/prod/frontend/values.yaml
helm template user-service charts/user-service -n travel-booking-prod -f environments/prod/user-service/values.yaml
helm template search-service charts/search-service -n travel-booking-prod -f environments/prod/search-service/values.yaml
helm template booking-service charts/booking-service -n travel-booking-prod -f environments/prod/booking-service/values.yaml
helm template payment-service charts/payment-service -n travel-booking-prod -f environments/prod/payment-service/values.yaml
helm template notification-service charts/notification-service -n travel-booking-prod -f environments/prod/notification-service/values.yaml
helm template gateway-api charts/gateway-api -n travel-booking-prod -f environments/prod/gateway-api/values.yaml
```

## Helm Install on Kind

Install infra first:

```bash
helm upgrade --install infra infra -n travel-booking-dev -f environments/dev/infra/values.yaml
kubectl rollout status deployment/redis -n travel-booking-dev
kubectl rollout status statefulset/postgres -n travel-booking-dev
```

Install services:

```bash
helm upgrade --install frontend charts/frontend -n travel-booking-dev -f environments/dev/frontend/values.yaml
helm upgrade --install user-service charts/user-service -n travel-booking-dev -f environments/dev/user-service/values.yaml
helm upgrade --install search-service charts/search-service -n travel-booking-dev -f environments/dev/search-service/values.yaml
helm upgrade --install booking-service charts/booking-service -n travel-booking-dev -f environments/dev/booking-service/values.yaml
helm upgrade --install payment-service charts/payment-service -n travel-booking-dev -f environments/dev/payment-service/values.yaml
helm upgrade --install notification-service charts/notification-service -n travel-booking-dev -f environments/dev/notification-service/values.yaml
```

Install Gateway API routing only if Gateway API CRDs, controller, and GatewayClass already exist:

```bash
helm upgrade --install gateway-api charts/gateway-api -n travel-booking-dev -f environments/dev/gateway-api/values.yaml
```

## Helm Upgrade One Service

Example for `payment-service`:

```bash
helm upgrade --install payment-service charts/payment-service \
  -n travel-booking-dev \
  -f environments/dev/payment-service/values.yaml \
  --set image.tag=git-abc1234
```

## Helm Rollback

```bash
helm history payment-service -n travel-booking-dev
helm rollback payment-service <REVISION> -n travel-booking-dev
```

## Check Deployment

```bash
kubectl get pods -n travel-booking-dev
kubectl get svc -n travel-booking-dev
kubectl get hpa -n travel-booking-dev
kubectl get pdb -n travel-booking-dev
kubectl get networkpolicy -n travel-booking-dev
kubectl get gateway,httproute -n travel-booking-dev
```

Rollout status:

```bash
kubectl rollout status deployment/frontend -n travel-booking-dev
kubectl rollout status deployment/user-service -n travel-booking-dev
kubectl rollout status deployment/search-service -n travel-booking-dev
kubectl rollout status deployment/booking-service -n travel-booking-dev
kubectl rollout status deployment/payment-service -n travel-booking-dev
kubectl rollout status deployment/notification-service -n travel-booking-dev
```

Logs:

```bash
kubectl logs -n travel-booking-dev deploy/user-service
kubectl logs -n travel-booking-dev deploy/search-service
kubectl logs -n travel-booking-dev deploy/booking-service
kubectl logs -n travel-booking-dev deploy/payment-service
kubectl logs -n travel-booking-dev deploy/notification-service
```

## Argo CD Deployment

Argo CD should deploy from the GitOps repository, not from Jenkins.

CI/CD flow:

```text
Developer
  -> Application repo
  -> Jenkins
  -> tests/scans/build/push image
  -> update environments/<env>/<service>/values.yaml in GitOps repo
  -> Argo CD syncs
  -> Helm chart renders
  -> Kubernetes deploys
```

Apply Argo CD Applications:

```bash
kubectl apply -f argocd/infra.yaml
kubectl apply -f argocd/frontend.yaml
kubectl apply -f argocd/user-service.yaml
kubectl apply -f argocd/search-service.yaml
kubectl apply -f argocd/booking-service.yaml
kubectl apply -f argocd/payment-service.yaml
kubectl apply -f argocd/notification-service.yaml
kubectl apply -f argocd/gateway-api.yaml
```

Check Applications:

```bash
kubectl get applications -n argocd
```

Sync with Argo CD CLI:

```bash
argocd app sync frontend
argocd app sync infra
argocd app sync user-service
argocd app sync search-service
argocd app sync booking-service
argocd app sync payment-service
argocd app sync notification-service
argocd app sync gateway-api
```

Check app status:

```bash
argocd app get frontend
argocd app get infra
argocd app get payment-service
argocd app get gateway-api
```

## Argo CD Important Values

Each Application points to one chart:

```yaml
source:
  path: charts/payment-service
  helm:
    releaseName: payment-service
    valueFiles:
      - ../../environments/prod/payment-service/values.yaml
```

This means `payment-service` deploys independently from all other services.

Before using Argo CD, update this placeholder in every `argocd/*.yaml` file:

```yaml
repoURL: https://github.com/10ajaykumar/travel-booking-gitops.git
```

Use your real GitOps repository URL.

## Gateway API Notes

The `gateway-api` chart references a GatewayClass:

```yaml
gateway:
  gatewayClassName: gke-l7-global-external-managed
```

This chart does not create the GatewayClass. Install Gateway API infrastructure first.

For local Kind, either:

- install a Gateway API controller such as Envoy Gateway, or
- skip `gateway-api` and access services with `kubectl port-forward`

Port-forward frontend:

```bash
kubectl port-forward -n travel-booking-dev svc/frontend 8080:80
```

Open:

```text
http://localhost:8080
```

## Secrets

Do not commit real secrets to Git.

The service charts support:

- `secretKeyRef`
- `envFrom.secretRef`
- optional External Secrets Operator via `externalSecrets`

Example ExternalSecret values:

```yaml
externalSecrets:
  - enabled: true
    name: payment-service-secrets
    refreshInterval: 1h
    secretStoreRef:
      name: aws-secretsmanager
      kind: ClusterSecretStore
    target:
      name: travel-booking-database
      creationPolicy: Owner
    data:
      - secretKey: username
        remoteRef:
          key: prod/travel-booking/database
          property: username
      - secretKey: password
        remoteRef:
          key: prod/travel-booking/database
          property: password
```

## Troubleshooting

ImagePullBackOff:

- verify `image.repository`
- verify immutable `image.tag`
- verify ECR permissions
- verify image pull secret if required

CrashLoopBackOff:

- check logs
- check database/Redis connectivity
- check missing Secrets
- check ConfigMap values

Readiness or liveness probe failure:

- frontend uses `/`
- backend services use `/health`
- confirm service port matches the application port

HPA not scaling:

- install metrics-server
- confirm resource requests exist
- check HPA target values

PDB blocking eviction:

- compare `minAvailable` with current ready pod count
- reduce PDB strictness for small dev environments

NetworkPolicy blocking traffic:

- check ingress rules for caller service labels
- check egress rules for Postgres, Redis, DNS, and service-to-service calls

Gateway not working:

- confirm Gateway API CRDs exist
- confirm GatewayClass exists
- check Gateway status
- check HTTPRoute status
- check cloud load balancer/controller logs

Argo CD OutOfSync:

- check whether Jenkins updated the correct values file
- compare desired and live manifests
- check if Helm dependencies are committed or resolvable

Argo CD SyncFailed:

- check `argocd app get <app>`
- check repo URL and path
- check Helm values file path
- check missing CRDs such as Gateway API or ExternalSecret

Helm dependency error:

- run `helm dependency update charts/<service>`
- confirm `charts/common` exists

Helm rendering error:

- run `helm template --debug`
- verify required values such as `image.repository` and `image.tag`
