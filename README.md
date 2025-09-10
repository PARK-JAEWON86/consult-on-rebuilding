# Consulton

Expert consultation platform built with modern technologies.

## Local Run (Stage 1)

### Requirements
- Node.js 20+
- pnpm 9+

### Run
- **API**: `pnpm dev:api` → http://localhost:4000/v1/health
- **WEB**: `pnpm dev:web` → http://localhost:3000/health

### Troubleshooting
- **CORS 에러**: `apps/api/src/main.ts`의 CORS 정규식 확인
- **연결 실패**: `.env` 파일 경로와 값 확인

## Architecture

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: NestJS with TypeScript
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Package Manager**: pnpm with workspaces

## Project Structure

```
consulton/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend application
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── tsconfig/     # Shared TypeScript configurations
│   └── eslint-config/# Shared ESLint configurations
└── infra/
    └── docker/       # Docker infrastructure
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd consulton
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Start the infrastructure:
```bash
cd infra/docker
docker-compose up -d
```

5. Start the development servers:
```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:web  # Frontend on http://localhost:3000
pnpm dev:api  # Backend on http://localhost:3001
```

## Available Scripts

- `pnpm dev` - Start both web and API in development mode
- `pnpm dev:web` - Start only the web application
- `pnpm dev:api` - Start only the API application
- `pnpm build` - Build all applications
- `pnpm test` - Run tests for all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages

## API Documentation

When running in development mode, API documentation is available at:
- http://localhost:3001/v1/docs (Swagger UI)

## Development Guidelines

This project follows the rules defined in `cursor-rules.yml`. Key points:

- **Frontend**: Next.js App Router only, Tailwind for styling, TanStack Query + Zustand for state
- **Backend**: NestJS modular structure, Prisma ORM, Zod validation
- **API**: All endpoints use `/v1` prefix, standardized response format
- **Authentication**: JWT with refresh token rotation
- **File Upload**: S3 pre-signed URLs only
- **Testing**: Jest for unit/integration, Playwright for E2E

## Environment Variables

See `env.example` for required environment variables.

## License

Private - All rights reserved
