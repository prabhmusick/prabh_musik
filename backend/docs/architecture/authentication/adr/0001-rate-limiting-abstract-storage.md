# ADR 0001: Abstract Storage Rate Limiting

## Status
Accepted

## Context
To protect user endpoints (such as Signup, Login, and Password Reset) from denial-of-service and credential stuffing attacks, we require a robust rate-limiting solution. The backend currently operates on a single SQLite instance, and local development is self-contained. 

However, as traffic scales, multiple instances of the backend service will be deployed behind load balancers. An in-memory rate-limiter Map would isolate hit tracking to each local thread, making it easy to bypass by alternating servers. To resolve this, a shared cache (such as Redis) is required for production, while development should remain setup-free (using local in-memory storage).

## Decision
We implement a rate-limiter middleware built around an abstract storage interface `RateLimitStore`. 
* By default, the middleware instantiates `InMemoryStore`.
* Developers can configure rate limits for any route by invoking a reusable factory `rateLimit({ windowMs, max, store })`.
* In production, the system can inject a `RedisStore` extending the base class, without modifying any controllers, routes, or middleware wrappers.

## Consequences
* **Decoupling**: Prevents the routing and controller adapters from binding to specific storage database layers.
* **Testing Simplicity**: Enables easy test isolation in unit runs (using clean store instances).
* **Extensibility**: Facilitates drop-in replacements for alternative databases (Redis, DynamoDB, MemoryStore) down the road.
