# ADR 0002: AsyncLocalStorage for Request Correlation

## Status
Accepted

## Context
As requests flow through routes, controllers, services, repositories, and third-party libraries, diagnosing issues in production requires tracing execution steps. Correlation IDs (`requestId`) are standard in enterprise environments.

Historically, tracing required passing the `requestId` as a parameter to every method (e.g. `signup(userData, clientContext, requestId)`), polluting function signatures and code patterns. Developers frequently forget to pass the tracer, creating debugging gaps. We need a way to implicitly bind and carry request-specific metadata across async execution threads.

## Decision
We utilize Node.js's native `AsyncLocalStorage` (built into the `async_hooks` core module) to bind request-specific correlation IDs.
* A central `loggerContext` is exposed by the logger module.
* The Request ID middleware intercepts every HTTP request, generates/reuses the `requestId` UUID, and executes `loggerContext.run({ requestId }, () => next())`.
* The logger utility automatically checks for an active store. If present, it injects `requestId` into the structured JSON logs.

## Consequences
* **Clean APIs**: Services, repositories, and helper functions do not need to accept tracking parameters.
* **Trace Reliability**: Logs are automatically correlated, resolving tracing gaps when developers omit manual logging arguments.
* **Zero Dependencies**: Uses native Node.js core library execution APIs, minimizing package weight and security exposure.
