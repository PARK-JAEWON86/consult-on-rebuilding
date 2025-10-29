#!/bin/bash

echo "🛑 개발 서버 중지 중..."

# 모든 개발 서버 프로세스 종료
pkill -9 node 2>/dev/null
pkill -9 pnpm 2>/dev/null
pkill -9 concurrently 2>/dev/null

# 포트 점유 프로세스 정리
lsof -ti:3001,4000 2>/dev/null | xargs kill -9 2>/dev/null

echo "✅ 개발 서버 중지 완료"

# 결과 확인
sleep 1
if lsof -ti:3001,4000 > /dev/null 2>&1; then
    echo "⚠️ 일부 프로세스가 여전히 실행 중입니다"
    lsof -i:3001,4000
else
    echo "✅ 모든 포트 해제됨"
fi
