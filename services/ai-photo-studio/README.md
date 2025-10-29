# AI Photo Studio Service

Google Cloud Run 기반 프로필 사진 AI 변환 서비스입니다. Gemini AI를 사용하여 일반 셀카를 전문적인 프로필 사진으로 변환합니다.

## 기능

- 셀카 → 전문 스튜디오 프로필 사진 변환
- Gemini 2.5 Flash Image 모델 사용
- 3:4 비율 프로필 사진 최적화
- JPEG, PNG, WebP 지원
- 최대 10MB 파일 크기

## 로컬 개발

### 필수 요구사항

- Node.js 18+
- Google Cloud 계정
- Gemini API Key ([Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급)

### 설정

1. 의존성 설치:
```bash
cd services/ai-photo-studio
npm install
```

2. 환경 변수 설정:
```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 열어서 GEMINI_API_KEY 입력
# GEMINI_API_KEY=your_actual_api_key_here
```

3. 개발 서버 실행:
```bash
npm run dev
```

**참고**: 이미 `.env` 파일에 `GEMINI_API_KEY`가 있다면 2번 과정은 건너뛰어도 됩니다. 코드가 자동으로 `.env` 파일을 읽어옵니다.

서버가 http://localhost:8080 에서 실행됩니다.

## API 문서

### Health Check

```bash
GET /health
```

**응답:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "service": "ai-photo-studio"
}
```

### 사진 변환

```bash
POST /transform
Content-Type: multipart/form-data
```

**요청:**
- `photo`: 이미지 파일 (JPEG, PNG, WebP)

**응답 (성공):**
```json
{
  "success": true,
  "data": {
    "image": "base64_encoded_image_data",
    "mimeType": "image/png",
    "originalFilename": "selfie.jpg",
    "aiResponse": "AI 모델의 텍스트 응답"
  }
}
```

**응답 (실패):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 사용 예시

#### cURL
```bash
curl -X POST http://localhost:8080/transform \
  -F "photo=@/path/to/selfie.jpg"
```

#### JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);

const response = await fetch('https://your-service-url.run.app/transform', {
  method: 'POST',
  body: formData
});

const result = await response.json();
if (result.success) {
  const imageUrl = `data:${result.data.mimeType};base64,${result.data.image}`;
  // Use imageUrl in <img> tag
}
```

## Cloud Run 배포

### 사전 준비

1. Google Cloud CLI 설치 및 로그인:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. Container Registry API 활성화:
```bash
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com
```

### 배포 스크립트 사용

```bash
# 배포 스크립트에 실행 권한 부여
chmod +x deploy.sh

# 배포 실행 (GEMINI_API_KEY 필요)
./deploy.sh YOUR_GEMINI_API_KEY
```

### 수동 배포

1. Docker 이미지 빌드:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest .
```

2. Google Container Registry에 푸시:
```bash
docker push gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest
```

3. Cloud Run에 배포:
```bash
gcloud run deploy ai-photo-studio \
  --image gcr.io/YOUR_PROJECT_ID/ai-photo-studio:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

## 환경 변수

| 변수명 | 필수 | 설명 | 기본값 |
|--------|------|------|--------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API 키 | - |
| `PORT` | ❌ | 서버 포트 | 8080 |
| `NODE_ENV` | ❌ | 환경 모드 | production |

## 보안 고려사항

- GEMINI_API_KEY는 절대 코드에 하드코딩하지 마세요
- Cloud Run 배포 시 환경 변수나 Secret Manager 사용
- 프로덕션에서는 `--allow-unauthenticated` 대신 인증 설정 권장
- CORS 설정을 프로덕션 도메인으로 제한 권장

## 비용 최적화

- Cloud Run 무료 티어: 월 200만 요청, 360,000 vCPU-초, 180,000 GiB-초
- Gemini API 요금: [Google AI Pricing](https://ai.google.dev/pricing) 참고
- 메모리: 1Gi (필요시 조정)
- CPU: 1 vCPU (필요시 조정)
- Timeout: 300초 (AI 처리 시간 고려)

## 트러블슈팅

### "GEMINI_API_KEY is not configured"
- 환경 변수가 설정되지 않았습니다
- Cloud Run 서비스 설정에서 환경 변수 확인

### "Failed to generate transformed image"
- Gemini API 응답에 이미지가 없습니다
- 업로드한 이미지 형식 확인 (JPEG, PNG, WebP만 지원)
- 이미지 파일 크기 확인 (10MB 이하)

### "Invalid file type"
- 지원되지 않는 파일 형식입니다
- JPEG, PNG, WebP 형식만 지원

### 배포 실패
- `gcloud auth list`로 인증 확인
- `gcloud config list`로 프로젝트 ID 확인
- Container Registry API가 활성화되어 있는지 확인

## 라이선스

MIT
