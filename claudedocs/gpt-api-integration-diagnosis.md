# GPT API 연동 문제 진단 및 해결

## 📋 문제 상황
사용자 모드에서 AI 채팅 상담 페이지에서 GPT API 연동이 작동하지 않는 문제

## 🔍 진단 결과

### ✅ 정상 작동 확인된 부분
1. **OpenAI API 키**: 유효하며 정상 작동 (`test-api-key.js` 테스트 통과)
2. **OpenAI 패키지**: v6.3.0 정상 설치됨
3. **모델 설정**: `gpt-4o-mini` 정상 응답 확인
4. **모듈 구조**:
   - ChatModule이 OpenAIModule을 올바르게 import
   - OpenAIService가 ChatService에 주입됨
   - AppModule에 ChatModule 등록됨
5. **환경 변수**: `.env` 파일에 올바른 설정 존재
   ```
   OPENAI_API_KEY=sk-proj-T9LSpV3EuIrY...
   OPENAI_MODEL=gpt-4o-mini
   ```

### 🔧 적용한 수정사항

#### 1. OpenAIService 초기화 로깅 추가
**파일**: `apps/api/src/openai/openai.service.ts`

**변경 사항**:
- API 키 로드 확인 로깅
- 초기화 성공/실패 상태 명확화
- API 키 누락 시 명시적 에러 발생

```typescript
constructor(private configService: ConfigService) {
  const apiKey = configService.get<string>('OPENAI_API_KEY');

  // 🔍 디버깅: API 키 확인
  console.log('[OpenAIService] Initializing...');
  console.log('[OpenAIService] API Key present:', !!apiKey);
  console.log('[OpenAIService] API Key prefix:', apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING');

  if (!apiKey) {
    console.error('[OpenAIService] ❌ CRITICAL: OPENAI_API_KEY is not configured!');
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  this.client = new OpenAI({ apiKey });
  this.model = configService.get<string>('OPENAI_MODEL', 'gpt-3.5-turbo');

  console.log('[OpenAIService] ✅ Initialized successfully with model:', this.model);
}
```

#### 2. API 호출 상세 로깅 추가

**변경 사항**:
- OpenAI API 호출 전/후 로깅
- 에러 발생 시 상세 정보 출력
- 토큰 사용량 추적

```typescript
async generateChatResponse(...) {
  try {
    const formattedMessages = this.formatMessages(messages, systemPrompt);

    console.log('[OpenAIService] Calling OpenAI API...');
    console.log('[OpenAIService] Model:', this.model);
    console.log('[OpenAIService] Message count:', formattedMessages.length);

    const completion = await this.client.chat.completions.create({...});

    console.log('[OpenAIService] ✅ API call successful');
    console.log('[OpenAIService] Tokens used:', completion.usage?.total_tokens);

    return {...};
  } catch (error) {
    console.error('[OpenAIService] ❌ API call failed:', error);

    if (error instanceof OpenAI.APIError) {
      console.error('[OpenAIService] OpenAI API Error details:', {
        status: error.status,
        type: error.type,
        code: error.code,
        message: error.message
      });
      throw this.handleAPIError(error);
    }

    console.error('[OpenAIService] Unknown error:', error);
    throw new Error('AI 응답 생성 중 오류가 발생했습니다.');
  }
}
```

## 🧪 테스트 방법

### 1. 서버 재시작 확인
NestJS가 watch 모드로 실행 중이라면 자동으로 재컴파일됩니다.
서버 콘솔에서 다음 로그를 확인하세요:

```
[OpenAIService] Initializing...
[OpenAIService] API Key present: true
[OpenAIService] API Key prefix: sk-proj-T9LSpV3EuIrY...
[OpenAIService] ✅ Initialized successfully with model: gpt-4o-mini
```

### 2. 프론트엔드에서 채팅 테스트
1. 브라우저에서 `/chat` 페이지 접속
2. 로그인 상태 확인
3. 메시지 전송 시도
4. 서버 콘솔에서 다음 로그 확인:

```
[ChatService] sendMessage 호출됨: {...}
[OpenAIService] Calling OpenAI API...
[OpenAIService] Model: gpt-4o-mini
[OpenAIService] Message count: 2
[OpenAIService] ✅ API call successful
[OpenAIService] Tokens used: 47
```

### 3. 브라우저 개발자 도구 확인
- **Network 탭**: `/v1/chat/message` 요청 확인
- **Console 탭**: API 응답 로그 확인
  ```
  [Chat] Sending message to API: {...}
  [Chat] API response received: {...}
  [API Interceptor] Response received: {...}
  ```

## 🐛 문제가 계속될 경우

### 시나리오 1: OpenAIService 초기화 실패
**증상**: 서버 시작 시 에러 발생
```
[OpenAIService] ❌ CRITICAL: OPENAI_API_KEY is not configured!
```

**해결**:
1. `.env` 파일이 `apps/api/` 디렉토리에 있는지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. 서버를 완전히 재시작

### 시나리오 2: API 호출 실패 (401 Unauthorized)
**증상**:
```
[OpenAIService] OpenAI API Error details: { status: 401, ... }
```

**해결**:
1. API 키가 만료되었는지 확인
2. OpenAI 대시보드에서 새 키 발급
3. `.env` 파일 업데이트

### 시나리오 3: 모델 접근 권한 없음 (404/403)
**증상**:
```
[OpenAIService] OpenAI API Error details: { status: 404, message: 'model not found' }
```

**해결**:
1. `.env`에서 `OPENAI_MODEL` 변경:
   ```
   OPENAI_MODEL=gpt-3.5-turbo
   ```
2. 서버 재시작

### 시나리오 4: 프론트엔드 인증 문제
**증상**: 401 에러, "로그인이 필요합니다" 메시지

**해결**:
1. 로그아웃 후 다시 로그인
2. 브라우저 쿠키 확인 (개발자 도구 > Application > Cookies)
3. JWT 토큰이 올바르게 설정되었는지 확인

## 📊 검증 완료 항목

- ✅ OpenAI API 키 유효성 (`test-api-key.js` 통과)
- ✅ OpenAI 패키지 설치 (v6.3.0)
- ✅ 모델 설정 정상 (gpt-4o-mini 응답 확인)
- ✅ 환경 변수 설정 (.env 파일 확인)
- ✅ 모듈 의존성 구조 (ChatModule → OpenAIModule)
- ✅ 서비스 주입 (OpenAIService → ChatService)
- ✅ 백엔드 서버 실행 중
- ✅ 프론트엔드 API 클라이언트 설정
- ✅ 상세 로깅 추가 완료

## 🎯 다음 단계

1. **즉시 테스트**: 프론트엔드에서 채팅 메시지 전송
2. **로그 확인**: 서버 콘솔과 브라우저 콘솔 확인
3. **에러 리포트**: 로그에 표시되는 에러 메시지 확인
4. **추가 지원**: 에러가 계속되면 로그 공유

## 📝 생성된 테스트 파일

- `apps/api/test-openai-direct.js` - OpenAI API 직접 테스트
- 기존 파일: `apps/api/test-api-key.js` - API 키 유효성 검증
- 기존 파일: `apps/api/test-gpt.sh` - GPT 통합 테스트 (로그인 필요)

## ⚡ 빠른 체크리스트

```bash
# 1. API 키 테스트
cd apps/api && node test-api-key.js
# 예상 출력: ✅ API Key is VALID!

# 2. 서버 실행 확인
lsof -ti:4000
# 예상 출력: PID 번호

# 3. 환경 변수 확인
grep OPENAI_API_KEY apps/api/.env
# 예상 출력: OPENAI_API_KEY=sk-proj-...

# 4. 로그 모니터링 (새 터미널)
# 서버가 실행 중인 터미널에서 로그 확인
```

---

**수정 완료 일시**: 2025-10-15
**수정 파일**: `apps/api/src/openai/openai.service.ts`
**상태**: ✅ 로깅 추가 완료 - 테스트 필요
