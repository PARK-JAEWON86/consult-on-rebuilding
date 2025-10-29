#!/bin/bash

# AI Photo Studio Cloud Run 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 인자 확인
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: GEMINI_API_KEY가 필요합니다${NC}"
  echo "사용법: ./deploy.sh YOUR_GEMINI_API_KEY [PROJECT_ID] [REGION]"
  echo ""
  echo "예시: ./deploy.sh AIzaSy... my-project asia-northeast3"
  exit 1
fi

GEMINI_API_KEY=$1
PROJECT_ID=${2:-$(gcloud config get-value project 2>/dev/null)}
REGION=${3:-asia-northeast3}
SERVICE_NAME="ai-photo-studio"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# 프로젝트 ID 확인
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: Google Cloud 프로젝트 ID를 찾을 수 없습니다${NC}"
  echo "다음 중 하나를 실행하세요:"
  echo "  1. gcloud config set project YOUR_PROJECT_ID"
  echo "  2. ./deploy.sh YOUR_GEMINI_API_KEY YOUR_PROJECT_ID"
  exit 1
fi

echo -e "${GREEN}🚀 AI Photo Studio Cloud Run 배포 시작${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "프로젝트: ${PROJECT_ID}"
echo "리전: ${REGION}"
echo "서비스: ${SERVICE_NAME}"
echo "이미지: ${IMAGE_NAME}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. API 활성화 확인
echo -e "${YELLOW}📋 1/4 필수 API 활성화 중...${NC}"
gcloud services enable containerregistry.googleapis.com --project=${PROJECT_ID}
gcloud services enable run.googleapis.com --project=${PROJECT_ID}
echo -e "${GREEN}✅ API 활성화 완료${NC}"
echo ""

# 2. Docker 이미지 빌드
echo -e "${YELLOW}🔨 2/4 Docker 이미지 빌드 중...${NC}"
docker build -t ${IMAGE_NAME} .
echo -e "${GREEN}✅ Docker 이미지 빌드 완료${NC}"
echo ""

# 3. Google Container Registry에 푸시
echo -e "${YELLOW}📤 3/4 Container Registry에 푸시 중...${NC}"
docker push ${IMAGE_NAME}
echo -e "${GREEN}✅ 이미지 푸시 완료${NC}"
echo ""

# 4. Cloud Run에 배포
echo -e "${YELLOW}🚢 4/4 Cloud Run에 배포 중...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY} \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --project ${PROJECT_ID}

echo ""
echo -e "${GREEN}✅ 배포 완료!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format 'value(status.url)')

echo ""
echo -e "${GREEN}🎉 서비스가 성공적으로 배포되었습니다!${NC}"
echo ""
echo "서비스 URL: ${SERVICE_URL}"
echo ""
echo "테스트 방법:"
echo "  Health Check: curl ${SERVICE_URL}/health"
echo "  Transform: curl -X POST -F 'photo=@selfie.jpg' ${SERVICE_URL}/transform"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
