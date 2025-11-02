# Architecture Documentation

This directory contains architectural decision records (ADRs) and design documentation for the Domo AI MVP project.

## Architectural Decision Records (ADRs)

ADRs document important architectural decisions made during the development of this project:

- [ADR-001: Service Layer Architecture](./ADR-001-service-layer-architecture.md)
- [ADR-002: Domain-Driven File Organization](./ADR-002-domain-driven-file-organization.md)
- [ADR-003: Component Organization Strategy](./ADR-003-component-organization-strategy.md)
- [ADR-004: API Route Structure](./ADR-004-api-route-structure.md)
- [ADR-005: Testing Strategy](./ADR-005-testing-strategy.md)

## Architecture Overview

The project follows a domain-driven architecture with clear separation of concerns:

1. **Presentation Layer**: React components organized by feature and reusability
2. **API Layer**: Next.js API routes organized by business domain
3. **Service Layer**: Business logic extracted into domain-specific services
4. **Data Layer**: Supabase integration with type-safe database operations
5. **Integration Layer**: External API integrations (Tavus, ElevenLabs)

## Key Design Principles

- **Single Responsibility**: Each module has a single, well-defined purpose
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Interface Segregation**: Clients depend only on interfaces they use
- **Domain-Driven Design**: Code organization reflects business domains
- **Test-Driven Development**: Comprehensive test coverage for all critical functionality