# Consult On

전문가 상담 플랫폼 - 신뢰할 수 있는 전문가와 실시간 상담

## 🚀 빠른 시작

### 1. 원클릭 개발 환경 실행
```bash
# 환경 변수 설정
cp env.example .env

# 개발 환경 시작 (Docker + 백엔드 + 프론트엔드)
./start-dev.sh
```

### 2. 접속 및 테스트
- **프론트엔드**: http://localhost:3000
- **로그인 페이지**: http://localhost:3000/auth/login
- **백엔드 API**: http://localhost:3001/v1/health

### 3. 테스트 계정으로 로그인
- **이메일**: user1@test.com
- **비밀번호**: password123

### 4. 개발 환경 종료
```bash
./stop-dev.sh
```

## ⚡ 개별 실행 (고급 사용자)

### Requirements
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Manual Setup
```bash
# 1. 인프라 시작
cd infra/docker && docker-compose up -d

# 2. 백엔드 실행
cd apps/api
pnpm install
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm dev  # → http://localhost:3001

# 3. 프론트엔드 실행 (새 터미널)
cd apps/web
pnpm install
pnpm dev  # → http://localhost:3000
```

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

## 🔐 인증 시스템

### 로그인 기능
- **JWT 토큰**: Access(15분) + Refresh(14일) 로테이션
- **보안 쿠키**: httpOnly + secure 설정
- **Redis 화이트리스트**: refresh token jti 관리
- **Argon2 해싱**: 비밀번호 안전 저장

### API 엔드포인트
- `POST /v1/auth/login` - 로그인
- `POST /v1/auth/logout` - 로그아웃  
- `POST /v1/auth/refresh` - 토큰 갱신
- `GET /v1/auth/me` - 현재 사용자 조회

## 🛠 Development Guidelines

This project follows the rules defined in `cursor-rules.yml`. Key points:

- **Frontend**: Next.js App Router only, Tailwind for styling, TanStack Query + Zustand for state
- **Backend**: NestJS modular structure, Prisma ORM, Zod validation
- **API**: All endpoints use `/v1` prefix, standardized response format
- **Authentication**: JWT with refresh token rotation, Redis whitelist
- **File Upload**: S3 pre-signed URLs only
- **Testing**: Jest for unit/integration, Playwright for E2E

## Environment Variables

See `env.example` for required environment variables.

## License

Private - All rights reserved
