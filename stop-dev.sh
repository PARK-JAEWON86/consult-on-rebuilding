#!/bin/bash

# Consult On 개발 서버 종료 스크립트

echo "🛑 Consult On 개발 환경 종료 중..."

# PID 파일에서 프로세스 ID 읽기 및 종료
if [ -f "backend.pid" ]; then
  BACKEND_PID=$(cat backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "🔧 백엔드 서버 종료 중... (PID: $BACKEND_PID)"
    kill $BACKEND_PID
  fi
  rm backend.pid
fi

if [ -f "frontend.pid" ]; then
  FRONTEND_PID=$(cat frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "🎨 프론트엔드 서버 종료 중... (PID: $FRONTEND_PID)"
    kill $FRONTEND_PID
  fi
  rm frontend.pid
fi

# 포트 기반으로 남은 프로세스 정리
echo "🧹 남은 프로세스 정리 중..."
pkill -f "next-server" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Docker 컨테이너 종료 (선택사항)
read -p "Docker 컨테이너도 종료하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Docker 컨테이너 종료 중..."
  cd infra/docker && docker-compose down
  cd ../..
fi

# 로그 파일 정리
if [ -f "backend.log" ]; then
  echo "📝 백엔드 로그 아카이브..."
  mv backend.log "logs/backend-$(date +%Y%m%d-%H%M%S).log" 2>/dev/null || rm backend.log
fi

if [ -f "frontend.log" ]; then
  echo "📝 프론트엔드 로그 아카이브..."
  mv frontend.log "logs/frontend-$(date +%Y%m%d-%H%M%S).log" 2>/dev/null || rm frontend.log
fi

echo "✅ 개발 환경이 종료되었습니다."
