#!/bin/bash

API_URL="http://localhost:4000/v1"

# 1. 로그인
echo "=== 1. 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gpttest@example.com",
    "password": "Test1234@"
  }')
echo "$LOGIN_RESPONSE" | jq '.'

# 2. 채팅 메시지 전송
echo -e "\n=== 2. 채팅 메시지 전송 ==="
CHAT_RESPONSE=$(curl -s -b cookies.txt -X POST "$API_URL/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요! 오늘 기분이 좋지 않아요."
  }')
echo "$CHAT_RESPONSE" | jq '.'

# 응답 내용 확인
echo -e "\n=== AI 응답 내용 ==="
echo "$CHAT_RESPONSE" | jq -r '.data.content'

rm -f cookies.txt
