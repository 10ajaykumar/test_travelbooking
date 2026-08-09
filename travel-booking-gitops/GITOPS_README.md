# Travel Booking GitOps Helm Architecture

This repository now contains one independent Helm chart per application service:

```text
charts/
  common/
  gateway-api/
  frontend/
  user-service/
  search-service/
  booking-service/
  payment-service/
  notification-service/
```

Each service has its own Helm release, image repository and tag, replica settings, resources, probes, HPA, PDB, NetworkPolicy, ServiceAccount, ConfigMap, and deployment lifecycle. The `charts/common` chart is a Helm library chart used only for repeated Kubernetes patterns.

`charts/gateway-api` is a separate platform routing chart. It is not a microservice chart. It owns the shared Gateway API entry point and HTTPRoutes for:

- `/`
- `/api/users`
- `/api/search`
- `/api/bookings`
- `/api/payments`
- `/api/notifications`

It does not create `GatewayClass`. The `GatewayClass` must come from infrastructure, for example a Gateway API controller installed by the platform team, cloud provider, or ingress layer. This chart only references the class through `gateway.gatewayClassName`.

## Why Separate Charts

A production microservice platform should deploy and roll back services independently. If only `payment-service` changes, Jenkins updates only `environments/<env>/payment-service/values.yaml`, and Argo CD syncs only the `payment-service` Application and Helm release.

## Common Library Chart

`charts/common` is `type: library` and provides reusable templates for:

- labels and selector labels
- Deployment
- Service
- ServiceAccount
- ConfigMap
- HorizontalPodAutoscaler
- PodDisruptionBudget
- NetworkPolicy

The library intentionally avoids service business configuration. Ports, environment variables, probes, resources, NetworkPolicy rules, and image coordinates remain in each service chart values file.

## Values Contract

Jenkins must update this file for each changed service:

```text
environments/${DEPLOY_ENV}/${service.name}/values.yaml
```

The image contract is:

```yaml
image:
  repository: 041124309752.dkr.ecr.us-east-1.amazonaws.com/travel-booking-payment-service
  tag: "git-sha-or-build-id"
```

Do not use `latest` for production. Tags should be immutable, for example a Git SHA, build number plus SHA, or release version.

## Environment Layout

```text
environments/
  dev/
  staging/
  prod/
```

Dev uses one replica and low resources. Staging enables production-like HPA/PDB behavior with smaller limits. Prod enables HPA and PDB with higher replica minimums and non-`latest` placeholder tags that Jenkins must replace.

## Argo CD

There is one `Application` per service in `argocd/`. Each Application:

- points at one chart path, such as `charts/booking-service`
- uses one Helm release, such as `booking-service`
- loads one values file, such as `../../environments/prod/booking-service/values.yaml`
- deploys into `travel-booking-prod`
- enables automated sync, prune, and self-heal

Update `repoURL` in the Argo CD manifests to the real GitOps repository before applying them.

`argocd/gateway-api.yaml` deploys the routing chart separately from the service Applications. This keeps service deploys independent while still allowing the platform entry point to be managed by GitOps.

Run the commands below from the `travel-booking-gitops` directory:

```bash
cd travel-booking-gitops
```

## Local Kind Deployment

Install infrastructure first. For a local practice cluster, Bitnami charts are a reasonable option:

```bash
kubectl create namespace travel-booking-dev
kubectl create secret generic travel-booking-database -n travel-booking-dev --from-literal=username=postgres --from-literal=password=postgres
kubectl create secret generic travel-booking-jwt -n travel-booking-dev --from-literal=jwt-secret=change-me
kubectl create secret generic travel-booking-smtp -n travel-booking-dev --from-literal=host= --from-literal=username= --from-literal=password=
```

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql -n travel-booking-dev --set auth.username=postgres --set auth.password=postgres --set auth.database=postgres
helm install redis bitnami/redis -n travel-booking-dev --set architecture=standalone --set auth.enabled=false
```

If Bitnami service names differ, update `DB_HOST` and `REDIS_HOST` in the environment values.

## Helm Commands

Update dependencies:

```bash
helm dependency update charts/frontend
helm dependency update charts/user-service
helm dependency update charts/search-service
helm dependency update charts/booking-service
helm dependency update charts/payment-service
helm dependency update charts/notification-service
```

Lint:

```bash
helm lint charts/frontend
helm lint charts/user-service
helm lint charts/search-service
helm lint charts/booking-service
helm lint charts/payment-service
helm lint charts/notification-service
helm lint charts/gateway-api
```

Render with dev values:

```bash
helm template frontend charts/frontend -n travel-booking-dev -f environments/dev/frontend/values.yaml
helm template user-service charts/user-service -n travel-booking-dev -f environments/dev/user-service/values.yaml
helm template search-service charts/search-service -n travel-booking-dev -f environments/dev/search-service/values.yaml
helm template booking-service charts/booking-service -n travel-booking-dev -f environments/dev/booking-service/values.yaml
helm template payment-service charts/payment-service -n travel-booking-dev -f environments/dev/payment-service/values.yaml
helm template notification-service charts/notification-service -n travel-booking-dev -f environments/dev/notification-service/values.yaml
helm template gateway-api charts/gateway-api -n travel-booking-dev -f environments/dev/gateway-api/values.yaml
```

Install:

```bash
helm upgrade --install frontend charts/frontend -n travel-booking-dev -f environments/dev/frontend/values.yaml
helm upgrade --install user-service charts/user-service -n travel-booking-dev -f environments/dev/user-service/values.yaml
helm upgrade --install search-service charts/search-service -n travel-booking-dev -f environments/dev/search-service/values.yaml
helm upgrade --install booking-service charts/booking-service -n travel-booking-dev -f environments/dev/booking-service/values.yaml
helm upgrade --install payment-service charts/payment-service -n travel-booking-dev -f environments/dev/payment-service/values.yaml
helm upgrade --install notification-service charts/notification-service -n travel-booking-dev -f environments/dev/notification-service/values.yaml
helm upgrade --install gateway-api charts/gateway-api -n travel-booking-dev -f environments/dev/gateway-api/values.yaml
```

Upgrade one service:

```bash
helm upgrade --install payment-service charts/payment-service -n travel-booking-dev -f environments/dev/payment-service/values.yaml
```

Rollback:

```bash
helm history payment-service -n travel-booking-dev
helm rollback payment-service <REVISION> -n travel-booking-dev
```

## Troubleshooting

ImagePullBackOff: check `image.repository`, immutable `image.tag`, ECR auth, and image pull secret configuration.

CrashLoopBackOff: inspect `kubectl logs`, database/Redis reachability, missing secrets, and application env vars.

Readiness, liveness, or startup probe failure: verify the service port and health path. Backend services use `/health`; frontend uses `/`.

HPA not scaling: confirm metrics-server is installed, resource requests exist, and HPA targets are realistic.

PDB blocking eviction: check `minAvailable` or `maxUnavailable` against current ready replicas.

NetworkPolicy blocking traffic: inspect each service's ingress and egress rules. Backend callers were derived from the repository routing and service code.

ConfigMap problems: render with `helm template` and confirm the expected non-sensitive env vars are present.

Secret problems: create the referenced Kubernetes Secrets or wire External Secrets Operator to create them. Do not commit real passwords or tokens.

Helm rendering errors: run `helm dependency update`, then `helm lint`, then `helm template --debug`.

Helm dependency errors: ensure `charts/common` exists and each service chart has `repository: file://../common`.

Argo CD OutOfSync: compare the live manifest with the Git version and check whether Jenkins updated the correct environment values file.

Argo CD SyncFailed: inspect the Application events, Helm rendering output, missing namespace, missing CRDs, and invalid values.

Failed rollout: use `kubectl rollout status deployment/<service> -n <namespace>`, then inspect ReplicaSets, Pods, events, logs, probes, secrets, and NetworkPolicies.

## Existing Helm Chart Migration Notes

The original `helm/travel-booking` chart is a single chart that deploys all services, Postgres, Redis, Gateway, HTTPRoutes, Secrets, Services, Deployments, and HPAs together. The GitOps layout keeps the useful routing design but does not copy the monolithic release model.

Migrated:

- Gateway API entry point as `charts/gateway-api`
- HTTPRoutes for frontend and all backend API prefixes
- Gateway values for the existing `vijaygiduthuri.in` domain and `travel-booking-ip` static IP name in prod

Not copied intentionally:

- `latest` image tags, because production must use immutable tags
- hardcoded Kubernetes Secrets containing database/JWT values, because secrets must not live in Git
- in-chart Postgres and Redis as part of the application release, because production should use managed services or separately managed infrastructure charts
- GKE-only Gateway settings in base values, because Kind/dev must remain portable
- `GatewayClass`, because that belongs to infrastructure and must exist before this routing chart is synced
