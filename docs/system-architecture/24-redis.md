# Mondial ECO — Redis Usage & Architecture Specification

Every Redis capability in Mondial ECO is driven through a single shared multiplexer (`IConnectionMultiplexer`) configured in `backend/Program.cs`. This design guarantees that stateless API replicas can scale horizontally (`docker compose up -d --scale api=N`) while sharing identical session, real-time, security, and cache states.

---

## 1. Verified Redis Usages in Code

| Subsystem | Implementation Class / Method | Redis Key / Channel Pattern | Architectural Role & Necessity |
|---|---|---|---|
| **SignalR Backplane** | `AddStackExchangeRedis` | `MondialSignalR*` | **Multi-Replica WebSocket Pub/Sub**. Guarantees that when Replica A sends a chat message or notification, clients connected to Replica B or C receive it instantly. |
| **User Presence Tracking** | `RedisPresenceTracker.cs` | `Mondial:presence:{userId}` (Redis Sets) | **Active Connection Registry**. Tracks whether a user has active WebSocket connections across any replica, preventing false offline push alerts. |
| **ASP.NET DataProtection Key Ring**| `PersistKeysToStackExchangeRedis` | `Mondial-DataProtection-Keys` | **Stateless Cryptographic Ring**. Holds the encryption keys for email confirmation tokens, password reset hashes, and antiforgery tokens so requests can hit any replica. |
| **Distributed Cache** | `AddStackExchangeRedisCache` | `Mondial:*` | **Shared Distributed Cache**. Implements `IDistributedCache` for temporary query results, market data, and throttled payloads. |
| **Readiness Health Check** | `AspNetCore.HealthChecks.Redis` | `PING` command | **Load Balancer Gating**. Verifies Redis connectivity on `/health/ready`. Traefik routes traffic only to replicas with an active Redis connection. |

---

## 2. Deep Dive: Subsystem Configurations

### A. Shared Connection Multiplexer (`backend/Program.cs` lines 108–145)
- **Configuration String**: `Redis:Configuration` (defaults to `localhost:6379`, production uses `redis:6379`).
- **Resilience Policy**:
  - `AbortOnConnectFail = false`: Replicas do not crash on boot if Redis is briefly restarting; the driver reconnects in the background.
  - `ConnectRetry = 5`
  - `ConnectTimeout = 5000` (5 seconds)
  - `KeepAlive = 60` (60 seconds)
- **Development Fallback**: In `Development` environment, if Redis is disabled (`Redis:Enabled = false`) or unreachable, the system transparently falls back to `InMemoryPresenceTracker` and filesystem key storage (`.dataprotection-keys/`). Production strictly requires Redis.

### B. SignalR Real-Time Backplane (`Program.cs` lines 297–308)
- Configured with `ChannelPrefix = RedisChannel.Literal("MondialSignalR")`.
- When `NotificationHub` or `ChatHub` broadcasts to a group or user (e.g. `Clients.User(userId).SendAsync(...)`), the message is published into the Redis channel. All running API containers receive the message and push it to their local WebSocket connections.

### C. DataProtection Key Persistence (`Program.cs` lines 154–167)
- Key: `Mondial-DataProtection-Keys`.
- Ensures that sensitive tokens encrypted on one container can be decrypted by any other container behind the Traefik load balancer.

### D. Production Container Topography (`backend/docker-compose.yml`)
- Image: `redis:7-alpine`.
- Persistence: `--appendonly yes` (AOF durability).
- Volume: `redis-data:/data`.
- Authentication: `--requirepass ${REDIS_PASSWORD}`.
- Docker Healthcheck: `CMD redis-cli -a ${REDIS_PASSWORD} ping` (Interval: 10s, Timeout: 3s, Retries: 5).
