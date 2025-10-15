#!/bin/bash

API_URL="http://localhost:4000/v1"

echo "=== 1. Login ==="
LOGIN_RESP=$(curl -s -c /tmp/cookies.txt -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"gpttest@example.com","password":"Test1234@"}')
echo "$LOGIN_RESP" | jq '.success'

echo -e "\n=== 2. Send Chat Message ==="
CHAT_RESP=$(curl -s -b /tmp/cookies.txt -X POST "$API_URL/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message":"테스트 메시지입니다"}')
echo "$CHAT_RESP" | jq '.'

rm -f /tmp/cookies.txt
