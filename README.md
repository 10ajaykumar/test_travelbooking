
# Travel Booking Microservices - Helm Chart Structure

This project is a good DevOps practice project because it contains multiple services, a frontend, databases, cache, an API gateway, Dockerfiles, health checks, and service-to-service communication.

For production-style microservices, maintain one Helm chart per application service. This allows each service to be built, deployed, scaled, rolled back, and owned independently.

## Application Workflow

The application has two types of communication:

- Frontend to backend service communication
- Backend service to backend service communication

The frontend does not only communicate with one backend. It calls multiple backend services through the gateway.

```text
Browser
  -> frontend
  -> nginx / Gateway API / Ingress
  -> backend services
```

In local Docker Compose, `nginx/nginx.conf` works as the API gateway.

In Kubernetes production, Gateway API or Ingress can replace the custom nginx container.

## Service Communication Map

```text
frontend
  -> user-service
  -> search-service
  -> booking-service
  -> payment-service
  -> notification-service

booking-service
  -> notification-service

payment-service
  -> booking-service
  -> notification-service

search-service
  -> Redis
  -> searchdb PostgreSQL

notification-service
  -> Redis queue
  -> notification worker
  -> notificationdb PostgreSQL

user-service
  -> userdb PostgreSQL

booking-service
  -> bookingdb PostgreSQL

payment-service
  -> paymentdb PostgreSQL
```

## User Authentication Flow

Used for user register, login, profile fetch, and profile update.

```text
Browser
  -> frontend
  -> /api/users/register or /api/users/login
  -> user-service
  -> userdb PostgreSQL
```

After login, the frontend stores these values in browser `localStorage`:

```text
token
user
```

The token is sent in the `Authorization` header for protected APIs.

## Search Flow

Used for flight and hotel search.

```text
Browser
  -> frontend
  -> /api/search/flights or /api/search/hotels
  -> search-service
  -> Redis cache
  -> searchdb PostgreSQL
```

The search service checks Redis first. If the data is cached, it returns the cached result. If not cached, it reads from PostgreSQL and then stores the result in Redis.

## Booking Flow

Used when a user books a flight or hotel.

```text
Browser
  -> frontend
  -> /api/bookings/flight or /api/bookings/hotel
  -> booking-service
  -> bookingdb PostgreSQL
  -> notification-service
```

After creating a booking, `booking-service` sends a notification request to `notification-service`.

```text
booking-service
  -> POST /api/notifications/send
  -> notification-service
  -> Redis queue
  -> notification worker
  -> notificationdb PostgreSQL
```

## Payment Flow

Used when a user pays for a booking.

```text
Browser
  -> frontend
  -> /api/payments/process
  -> payment-service
  -> paymentdb PostgreSQL
  -> mock payment gateway
```

If payment succeeds:

```text
payment-service
  -> booking-service
  -> update booking status

payment-service
  -> notification-service
  -> create payment success notification
```

If payment fails:

```text
payment-service
  -> notification-service
  -> create payment failed notification
```

## Notification Flow

Notifications are created by backend services and fetched by the frontend.

```text
booking-service or payment-service
  -> notification-service
  -> Redis queue
  -> notification worker
  -> notificationdb PostgreSQL
```

The frontend fetches notifications with:

```text
frontend
  -> GET /api/notifications/user/:userId
  -> notification-service
  -> notificationdb PostgreSQL
```

The frontend marks a notification as read with:

```text
frontend
  -> PUT /api/notifications/:id/read
  -> notification-service
  -> notificationdb PostgreSQL
```

## Complete Architecture Diagram

```text
                         +----------------+
                         |    Browser     |
                         +--------+-------+
                                  |
                                  v
                         +----------------+
                         |    Frontend    |
                         +--------+-------+
                                  |
                                  v
                  +-------------------------------+
                  | nginx / Gateway API / Ingress |
                  +---------------+---------------+
                                  |
        +-------------------------+--------------------------+
        |                         |                          |
        v                         v                          v
+---------------+        +----------------+          +-----------------+
| user-service  |        | search-service |          | booking-service |
+-------+-------+        +-------+--------+          +--------+--------+
        |                        |                            |
        v                        v                            v
   userdb PostgreSQL       Redis cache                  bookingdb
                             searchdb                        |
                                                             v
                                                   notification-service

+-----------------+                                          |
| payment-service |------------------------------------------+
+--------+--------+
         |
         +-> paymentdb PostgreSQL
         +-> mock payment gateway
         +-> booking-service
         +-> notification-service

+----------------------+
| notification-service |
+----------+-----------+
           |
           v
      Redis queue
           |
           v
 notification worker
           |
           v
 notificationdb PostgreSQL
```

## Gateway Routing

In Docker Compose, nginx routes traffic using `nginx/nginx.conf`.

```text
/api/users          -> user-service:3001
/api/search         -> search-service:3002
/api/bookings       -> booking-service:3003
/api/payments       -> payment-service:3004
/api/notifications  -> notification-service:3005
/                   -> frontend
```

If Kubernetes Gateway API is used, the custom nginx container is not required. The same routing should be created with `Gateway` and `HTTPRoute` resources.

Production-style Gateway API pattern:

```text
One shared Gateway per environment or domain
One HTTPRoute per microservice
```

Example:

```text
travelbooking-gateway
  -> frontend-route
  -> user-service-route
  -> search-service-route
  -> booking-service-route
  -> payment-service-route
  -> notification-service-route
```

## Recommended Production Tree

```text
application/
  docker-compose.yml
  README.md

  frontend/
    Dockerfile
    package.json
    public/
    src/

  user-service/
    Dockerfile
    go.mod
    main.go
    internal/

  search-service/
    Dockerfile
    go.mod
    main.go
    internal/

  booking-service/
    Dockerfile
    go.mod
    main.go
    internal/

  payment-service/
    Dockerfile
    go.mod
    main.go
    internal/

  notification-service/
    Dockerfile
    go.mod
    main.go
    internal/

  nginx/
    nginx.conf

  postgres/
    init.sql

  helm/
    user-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        secret.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        servicemonitor.yaml
        NOTES.txt

    search-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        servicemonitor.yaml
        NOTES.txt

    booking-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        secret.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        servicemonitor.yaml
        NOTES.txt

    payment-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        secret.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        servicemonitor.yaml
        NOTES.txt

    notification-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        servicemonitor.yaml
        NOTES.txt

    frontend/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        ingress.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        NOTES.txt

    gateway/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        configmap.yaml
        ingress.yaml
        serviceaccount.yaml
        hpa.yaml
        pdb.yaml
        networkpolicy.yaml
        NOTES.txt

  infrastructure/
    postgres/
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml

    redis/
      values-dev.yaml
      values-stage.yaml
      values-prod.yaml

    ingress-nginx/
      values.yaml

    cert-manager/
      values.yaml

    monitoring/
      prometheus-values.yaml
      grafana-values.yaml

    external-secrets/
      values.yaml

  gitops/
    dev/
      user-service-values.yaml
      search-service-values.yaml
      booking-service-values.yaml
      payment-service-values.yaml
      notification-service-values.yaml
      frontend-values.yaml
      gateway-values.yaml

    stage/
      user-service-values.yaml
      search-service-values.yaml
      booking-service-values.yaml
      payment-service-values.yaml
      notification-service-values.yaml
      frontend-values.yaml
      gateway-values.yaml

    prod/
      user-service-values.yaml
      search-service-values.yaml
      booking-service-values.yaml
      payment-service-values.yaml
      notification-service-values.yaml
      frontend-values.yaml
      gateway-values.yaml

  .github/
    workflows/
      user-service-ci-cd.yaml
      search-service-ci-cd.yaml
      booking-service-ci-cd.yaml
      payment-service-ci-cd.yaml
      notification-service-ci-cd.yaml
      frontend-ci-cd.yaml
      gateway-ci-cd.yaml
```

## Why Separate Charts

Each microservice should have its own chart because production teams deploy services independently.

If only `payment-service` changes, deploy only that service:

```bash
helm upgrade --install payment-service ./helm/payment-service \
  -n travelbooking-prod \
  -f ./helm/payment-service/values-prod.yaml \
  --set image.tag=1.4.0
```

This gives:

- Independent deployments
- Independent rollback
- Independent scaling
- Independent service ownership
- Smaller production risk
- Cleaner CI/CD pipelines

## Chart Files

Each service chart should contain these files.

```text
Chart.yaml
values.yaml
values-dev.yaml
values-stage.yaml
values-prod.yaml
templates/
  _helpers.tpl
  deployment.yaml
  service.yaml
  configmap.yaml
  secret.yaml
  serviceaccount.yaml
  hpa.yaml
  pdb.yaml
  networkpolicy.yaml
  servicemonitor.yaml
  ingress.yaml
  NOTES.txt
```

Not every service needs every template.

Backend services usually need:

- `deployment.yaml`
- `service.yaml`
- `configmap.yaml`
- `secret.yaml`
- `serviceaccount.yaml`
- `hpa.yaml`
- `pdb.yaml`
- `networkpolicy.yaml`
- `servicemonitor.yaml`

Only public services usually need:

- `ingress.yaml`

For this project, public services are usually:

- `frontend`
- `gateway`

Private services are usually:

- `user-service`
- `search-service`
- `booking-service`
- `payment-service`
- `notification-service`
- `postgres`
- `redis`

## Example Chart.yaml

```yaml
apiVersion: v2
name: payment-service
description: Helm chart for TravelBooking payment-service
type: application
version: 1.0.0
appVersion: "1.0.0"
```

`version` is the Helm chart version.

`appVersion` is the application version.

## Example values-prod.yaml

```yaml
replicaCount: 3

image:
  repository: ghcr.io/your-org/payment-service
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3004

env:
  PORT: "3004"
  DB_HOST: postgres.infrastructure.svc.cluster.local
  DB_PORT: "5432"
  DB_NAME: paymentdb
  DB_SSLMODE: disable
  BOOKING_SERVICE_URL: http://booking-service:3003
  NOTIFICATION_SERVICE_URL: http://notification-service:3005

secretRefs:
  DB_USER: payment-service-db-user
  DB_PASSWORD: payment-service-db-password
  JWT_SECRET: jwt-secret

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

readinessProbe:
  path: /health
  port: 3004

livenessProbe:
  path: /health
  port: 3004
```

## Infrastructure

Keep infrastructure separate from application services.

Application charts:

```text
user-service
search-service
booking-service
payment-service
notification-service
frontend
gateway
```

Infrastructure:

```text
postgres
redis
ingress-nginx
cert-manager
prometheus
grafana
external-secrets
```

For real production, Postgres and Redis are often managed services:

- AWS RDS and ElastiCache
- GCP Cloud SQL and Memorystore
- Azure Database and Azure Cache

For DevOps practice, you can install them with Helm:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql -n infrastructure -f infrastructure/postgres/values-dev.yaml
helm install redis bitnami/redis -n infrastructure -f infrastructure/redis/values-dev.yaml
```

## Environment Strategy

Use separate values files per environment.

```text
values-dev.yaml
values-stage.yaml
values-prod.yaml
```

Example:

```bash
helm upgrade --install user-service ./helm/user-service \
  -n travelbooking-dev \
  -f ./helm/user-service/values-dev.yaml
```

```bash
helm upgrade --install user-service ./helm/user-service \
  -n travelbooking-prod \
  -f ./helm/user-service/values-prod.yaml
```

Dev usually has:

- 1 replica
- Smaller CPU and memory
- Debug-friendly settings
- Lower cost

Production usually has:

- 2 or more replicas
- Resource requests and limits
- HPA
- PDB
- NetworkPolicy
- Secret manager integration
- Monitoring and alerting

## CI/CD Flow

Production-style flow:

```text
Developer changes payment-service
CI runs tests
CI builds Docker image
CI pushes image to registry
CI runs helm lint
CI runs helm template
CI deploys only payment-service
Smoke test runs after deployment
```

Example commands:

```bash
helm lint ./helm/payment-service
helm template payment-service ./helm/payment-service -f ./helm/payment-service/values-prod.yaml
helm upgrade --install payment-service ./helm/payment-service \
  -n travelbooking-prod \
  -f ./helm/payment-service/values-prod.yaml \
  --set image.tag=git-8f3a91c
```

Rollback:

```bash
helm history payment-service -n travelbooking-prod
helm rollback payment-service 12 -n travelbooking-prod
```

## GitOps Flow

For stronger production experience, use GitOps with Argo CD or Flux.

Recommended flow:

```text
Application repository:
  Source code
  Dockerfiles
  Helm charts
  CI tests
  Image build pipeline

GitOps repository:
  Environment values
  Image tags
  Argo CD applications
```

Production deployment flow:

```text
Code merged
Image built and pushed
GitOps values updated with new image tag
Argo CD syncs cluster
Service is deployed
```

## Secrets

Do not store real passwords or JWT secrets directly in Git.

For learning:

- Kubernetes Secrets

For production:

- External Secrets Operator
- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault
- HashiCorp Vault
- Sealed Secrets

## Recommended Learning Order

1. Run the full app with Docker Compose.
2. Create Kubernetes YAML manually for one service.
3. Convert that service into a Helm chart.
4. Repeat for all services.
5. Add environment values files.
6. Add HPA, probes, requests, and limits.
7. Add ingress or gateway.
8. Add Prometheus and Grafana.
9. Add CI/CD for each service.
10. Add Argo CD GitOps deployment.

## Final Production Rule

Use one Helm chart per microservice. Manage shared infrastructure separately. Deploy only the changed service through its own CI/CD pipeline. Use GitOps, immutable image tags, secret manager integration, health checks, resource limits, autoscaling, and monitoring for production-level practice.
