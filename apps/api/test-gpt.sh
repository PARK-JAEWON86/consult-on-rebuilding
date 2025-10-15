#!/bin/bash

COOKIE_FILE="/tmp/gpt-test-cookies.txt"

echo "=== GPT 채팅 통합 테스트 ==="
echo ""

echo "1. 로그인 중..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -X POST "http://localhost:4000/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "gpttest@example.com", "password": "Test1234@"}')

echo "✅ 로그인 성공!"
echo "Login Response: $LOGIN_RESPONSE" | python3 -m json.tool
echo ""

echo "2. GPT에게 메시지 전송 중... (실제 OpenAI API 호출)"
echo ""

RESPONSE=$(curl -s -b "$COOKIE_FILE" -X POST "http://localhost:4000/v1/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "안녕하세요! 오늘 기분이 좀 우울한데 조언 부탁드려요."}')

echo "📬 GPT 응답:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "3. AI 사용량 확인 중..."
USAGE=$(curl -s -b "$COOKIE_FILE" -X GET "http://localhost:4000/v1/ai-usage")

echo "📊 사용량 정보:"
echo "$USAGE" | python3 -m json.tool

rm -f "$COOKIE_FILE"
