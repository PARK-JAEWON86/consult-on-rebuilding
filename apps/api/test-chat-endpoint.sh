#!/bin/bash

echo "=== 채팅 엔드포인트 테스트 ==="
echo ""

# 먼저 로그인 (실제 사용자 계정 필요)
echo "1. 서버 상태 확인..."
curl -s http://localhost:4000/v1/health | python3 -m json.tool 2>/dev/null || echo "서버가 실행 중이지 않습니다"
echo ""

echo "2. 인증 필요 - 브라우저의 쿠키를 사용하여 테스트하거나"
echo "   로그인된 세션으로 다음 명령어를 직접 실행하세요:"
echo ""
echo "curl -X POST 'http://localhost:4000/v1/chat/message' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Cookie: <브라우저에서 복사한 쿠키>' \\"
echo "  -d '{\"message\": \"안녕하세요 테스트입니다\"}'"
echo ""
echo "또는 브라우저 개발자 도구의 Network 탭에서"
echo "/v1/chat/message 요청의 Response를 확인하세요."
