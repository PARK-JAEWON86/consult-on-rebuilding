#!/bin/bash

# Consult On 개발 서버 실행 스크립트

echo "🚀 Consult On 개발 환경 시작..."

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
  echo "⚠️  .env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요."
  echo "   cp env.example .env"
  echo "   그리고 .env 파일의 값들을 적절히 수정하세요."
  exit 1
fi

# Docker 컨테이너 시작 (MySQL, Redis)
echo "📦 Docker 컨테이너 시작..."
cd infra/docker && docker-compose up -d
cd ../..

# 잠시 대기 (컨테이너 시작 시간)
echo "⏳ 데이터베이스 준비 중..."
sleep 3

# 백엔드 서버 시작
echo "🔧 백엔드 서버 시작 중..."
cd apps/api

# 의존성 설치
echo "📦 백엔드 의존성 설치..."
pnpm install

# 데이터베이스 마이그레이션
echo "🗄️  데이터베이스 마이그레이션..."
pnpm prisma migrate deploy

# 시드 데이터 생성
echo "🌱 테스트 데이터 생성..."
pnpm prisma db seed

# 백엔드 서버 백그라운드 실행
echo "🚀 백엔드 서버 실행 (포트 3001)..."
PORT=3001 pnpm start:dev > ../../backend.log 2>&1 &
BACKEND_PID=$!

cd ../..

# 프론트엔드 서버 시작
echo "🎨 프론트엔드 서버 시작 중..."
cd apps/web

# 의존성 설치
echo "📦 프론트엔드 의존성 설치..."
pnpm install

# 프론트엔드 서버 백그라운드 실행
echo "🚀 프론트엔드 서버 실행 (포트 3000)..."
pnpm dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!

cd ../..

# PID 저장
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo ""
echo "✅ 개발 환경이 시작되었습니다!"
echo ""
echo "📍 접속 URL:"
echo "   - 프론트엔드: http://localhost:3000"
echo "   - 백엔드 API: http://localhost:3001"
echo "   - 로그인 페이지: http://localhost:3000/auth/login"
echo ""
echo "🔐 테스트 계정:"
echo "   - 이메일: user1@test.com"
echo "   - 비밀번호: password123"
echo ""
echo "📝 로그 확인:"
echo "   - 백엔드 로그: tail -f backend.log"
echo "   - 프론트엔드 로그: tail -f frontend.log"
echo ""
echo "🛑 서버 종료: ./stop-dev.sh"
echo ""

# 로그 실시간 출력
echo "📋 실시간 로그 (Ctrl+C로 종료):"
tail -f backend.log frontend.log
