# Dietyaar

Dietyaar is a bilingual Persian/English nutrition companion for manual meal planning, food logging, daily progress, and privacy-conscious optional AI assistance. The core product remains useful when AI features are disabled or unavailable.

## Status

The repository is at the foundation stage. It was safely adopted from `mhp-nextjs-boilerplate` without running the upstream destructive setup script.

## Stack

- Next.js App Router, React, strict TypeScript, and Tailwind CSS
- Locally owned shadcn/Radix UI primitives with RTL safeguards
- Prisma and PostgreSQL
- Better Auth (compatibility spike required before identity implementation)
- `next-intl` for request-scoped Persian and English localization
- Vitest, Playwright, Docker, GitHub Actions, and Renovate
- Supabase private storage for temporary media (planned)

## Documentation

- [Documentation map](docs/README.md)
- [Product specification](docs/product/product-spec.md)
- [Design scope](docs/design/design-scope.md)
- [Visual design direction](docs/design/visual-design.md)
- [Technical specification](docs/engineering/technical-spec.md)
- [Architecture decisions](docs/decisions/README.md)

When sources conflict, use the precedence rules in the technical specification.

## Local setup

Requirements: Node.js 22+, npm, and Docker (or PostgreSQL 14+).

```powershell
Copy-Item .env.example .env
npm install
npm run db:up
npm run db:generate
npm run db:deploy
npm run dev
```

Never commit `.env` or real credentials.

## Quality gates

```bash
npm run lint:all
npm test
npm run build
```

End-to-end tests additionally require PostgreSQL and a Playwright browser. Optional AI work must not begin before the manual vertical slice passes end to end.

## Upstream provenance

- Repository: <https://github.com/amirmhp98/mhp-nextjs-boilerplate>
- Adopted commit: `a6228062889af58805fba519cd2c00331808893d`
- Adoption record: [ADR-008](docs/decisions/008-dietyaar-boilerplate-adoption.md)
