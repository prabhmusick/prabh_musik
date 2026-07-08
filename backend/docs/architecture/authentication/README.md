# Authentication Subsystem Architecture

This directory contains the structural documentation, flowcharts, security guidelines, and Architecture Decision Records (ADRs) for the Prabh Musik backend authentication and session management subsystem.

## Document Directory

* **[Core System Walkthrough](authentication-flow.md)**: Describes the sequence of middlewares, filters, and interceptors participating in the HTTP request-response cycle.
* **[Signup Architecture](signup.md)**: Details the registration pipeline, validation rules, transactional state management, and password hashing algorithms.
* **[Security Architecture](security.md)**: Outlines rate limiting algorithms, reverse proxy configurations, cookie parameters, and data sanitization boundaries.
* **[Error Handling Blueprint](error-handling.md)**: Defines the global error classification model, serialization schemas, and correlation tracking.

## Architecture Decision Records (ADR)

* **[ADR 0001: Abstract Storage Rate Limiting](adr/0001-rate-limiting-abstract-storage.md)**: Rationale behind decoupling rate limit logic from storage engines.
* **[ADR 0002: AsyncLocalStorage for Request Correlation](adr/0002-async-local-storage-correlation.md)**: Design for implicit log trace tracking across execution stacks.
