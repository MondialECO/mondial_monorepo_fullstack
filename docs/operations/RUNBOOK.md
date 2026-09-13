# Deployment & Operations Runbook — Mondial ECO

Procedures and verification standards for deploying, operating, and monitoring the Mondial ECO platform.

---

## 1. Architecture Topology

```
Internet (HTTPS 443)
       │
   [ Traefik ] ── (Let's Encrypt TLS / Automatic Routing)
       │
  ┌────┴─────────────────────────────┐
  │                                  │
  ▼                                  ▼
[ Next.js Frontend ]        [ ASP.NET Core API Replicas ]
(Port 3000)                 (Port 5000 / Kestrel)
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            [ MongoDB Atlas ]   [ Redis 7 ]   [ uploads-data ]
            (ACID ReplicaSet)   (Cache/Lock)  (Persistent Vol)
```

---

## 2. Pre-Deployment Verification

Before any deployment, verify the following:

- [ ] All unit and integration tests pass:
  - Frontend: `npm run lint && npm test`
  - Backend: `dotnet test`
- [ ] TypeScript compiles cleanly: `npx tsc --noEmit`
- [ ] All required environment variables are set in target environment (see [36-environment-map.md](../system-architecture/36-environment-map.md)).
- [ ] JWT Secret Key is at least 32 characters (`JwtSettings__Key`).
- [ ] MongoDB Atlas cluster is accessible and `Mongo__TransactionsEnabled` is set to `"true"`.
- [ ] OpenRouter API Key is provisioned.

---

## 3. Production Health Verification

After deploying new containers, verify system readiness:

### 3.1 Backend Health Endpoints

```bash
# Liveness probe (checks process responsiveness)
curl -f https://api.mondialbusiness.eu/health/live

# Readiness probe (checks MongoDB, Redis, and core dependencies)
curl -f https://api.mondialbusiness.eu/health/ready
```

Expected response for healthy system:
```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.0241021",
  "entries": {
    "mongodb": { "status": "Healthy" },
    "redis": { "status": "Healthy" }
  }
}
```

### 3.2 Frontend Ingress Check

```bash
curl -I https://mondialbusiness.eu
# Should return HTTP 200 OK
```

### 3.3 Authentication Smoke Check

```bash
curl -X POST https://api.mondialbusiness.eu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mondialbusiness.eu","password":"[REDACTED]"}'
```

---

## 4. Rollback Procedures

If health checks fail post-deployment:

1. Re-tag the previously known good container image tags in the deployment manifest.
2. Force-restart the service instances.
3. Check Traefik error logs for reverse proxy routing anomalies:
   ```bash
   docker logs traefik --tail 100
   ```
4. Verify Redis connectivity and cache state:
   ```bash
   docker exec -it redis redis-cli -a "$REDIS_PASSWORD" ping
   ```

---

## 5. Security & Secret Management

- **Zero Secrets in Code:** Environment secrets must never be committed to Git.
- **TLS Automation:** Managed by Traefik with ACME HTTP-01 or DNS-01 challenge.
- **Uploads Volume:** Uploaded assets reside in the `uploads-data` persistent volume mounted to `/app/uploads`.

---

## Related References

- **Environment Variable Map:** [docs/system-architecture/36-environment-map.md](../system-architecture/36-environment-map.md)
- **Technical Architecture:** [docs/system-architecture/MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md](../system-architecture/MONDIAL-ECO-TECHNICAL-ARCHITECTURE.md)
- **Deployment Diagram:** [docs/system-architecture/diagrams/25-production-deployment.mmd](../system-architecture/diagrams/25-production-deployment.mmd)
- **Documentation Authority:** [docs/DOCUMENTATION-AUTHORITY.md](../DOCUMENTATION-AUTHORITY.md)
