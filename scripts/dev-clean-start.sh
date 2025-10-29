#!/bin/bash

echo "🧹 기존 개발 서버 프로세스 정리 중..."

# 모든 Node.js, pnpm, concurrently 프로세스 강제 종료
pkill -9 node 2>/dev/null
pkill -9 pnpm 2>/dev/null
pkill -9 concurrently 2>/dev/null

# 잠시 대기 (프로세스 종료 완료)
sleep 2

# 포트 점유 프로세스 추가 정리
lsof -ti:3001,4000 2>/dev/null | xargs kill -9 2>/dev/null

echo "✅ 정리 완료"

# 포트 확인
echo "🔍 포트 상태 확인 중..."
sleep 1

if lsof -ti:3001,4000 > /dev/null 2>&1; then
    echo "⚠️ 경고: 포트가 여전히 사용 중입니다"
    echo "다음 프로세스들이 포트를 점유하고 있습니다:"
    lsof -i:3001,4000
    exit 1
else
    echo "✅ 포트 3001, 4000 사용 가능"
fi

echo ""
echo "🚀 개발 서버 시작 중..."
echo "----------------------------------------"

cd "$(dirname "$0")/.." || exit 1
pnpm run dev
