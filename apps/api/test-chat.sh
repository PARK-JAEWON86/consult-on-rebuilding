#!/bin/bash

# GPT 채팅 통합 테스트 스크립트

BASE_URL="http://localhost:4000/v1"

echo "=== 1. 사용자 로그인 ==="
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }')

echo "로그인 응답: $LOGIN_RESPONSE"

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ 로그인 실패. 테스트 사용자를 먼저 생성하세요."
  echo ""
  echo "다음 명령으로 테스트 사용자 생성:"
  echo 'curl -X POST "http://localhost:4000/v1/auth/register" \'
  echo '  -H "Content-Type: application/json" \'
  echo '  -d '"'"'{"email": "test@example.com", "password": "test1234", "name": "Test User"}'"'"
  exit 1
fi

echo "✅ 로그인 성공!"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

echo "=== 2. GPT 채팅 테스트 ==="
CHAT_RESPONSE=$(curl -s -X POST "${BASE_URL}/chat/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "message": "안녕하세요! 오늘 기분이 좀 우울한데 조언 부탁드려요."
  }')

echo "GPT 응답:"
echo "$CHAT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHAT_RESPONSE"
echo ""

echo "=== 3. AI 사용량 확인 ==="
USAGE_RESPONSE=$(curl -s -X GET "${BASE_URL}/ai-usage" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "사용량 정보:"
echo "$USAGE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USAGE_RESPONSE"
