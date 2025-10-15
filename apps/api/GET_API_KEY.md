# OpenAI API 키 발급 방법

## 1. OpenAI 계정 로그인
https://platform.openai.com

## 2. API Keys 페이지 접속
https://platform.openai.com/api-keys

## 3. 새 키 생성
1. "Create new secret key" 버튼 클릭
2. 키 이름 입력 (예: "consulton-chat")
3. 권한 설정 (기본값 OK)
4. "Create secret key" 클릭

## 4. 키 복사
⚠️ **중요**: 키는 한 번만 표시됩니다!
- 형식: `sk-proj-...` (약 200자)
- 전체 키를 복사해서 저장하세요

## 5. 크레딧 확인
- Free tier: $5 크레딧 (신규 가입)
- 유료: https://platform.openai.com/settings/organization/billing

## 현재 상태
❌ 제공하신 키가 유효하지 않습니다:
```
401 Incorrect API key provided
```

## 테스트 방법
새 키를 받으시면:
1. 저에게 키를 알려주세요
2. 제가 .env 파일 업데이트
3. 서버 재시작
4. GPT 채팅 테스트 ✅
