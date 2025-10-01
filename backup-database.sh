#!/bin/bash

# ==============================================
# 데이터베이스 백업 스크립트
# ==============================================

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 데이터베이스 정보
DB_USER="consulton"
DB_PASSWORD="password"
DB_NAME="consulton_dev"
DB_HOST="localhost"
DB_PORT="3306"

# 백업 디렉토리
BACKUP_DIR="./database/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/consulton_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}  데이터베이스 백업 시작${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo ""
echo -e "${GREEN}📊 백업 정보:${NC}"
echo -e "   데이터베이스: ${DB_NAME}"
echo -e "   호스트: ${DB_HOST}:${DB_PORT}"
echo -e "   백업 파일: ${BACKUP_FILE}"
echo ""

# mysqldump 실행
echo -e "${YELLOW}⏳ 백업 진행 중...${NC}"
/usr/local/mysql/bin/mysqldump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASSWORD}" \
  --databases "${DB_NAME}" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --routines \
  --triggers \
  --events \
  --add-drop-database \
  --add-drop-table \
  --compress \
  --result-file="${BACKUP_FILE}" 2>&1

# 백업 결과 확인
if [ $? -eq 0 ]; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo -e "${GREEN}✅ 백업 완료!${NC}"
  echo -e "   파일 크기: ${BACKUP_SIZE}"
  echo ""

  # Gzip 압축
  echo -e "${YELLOW}🗜️  압축 진행 중...${NC}"
  gzip -9 "${BACKUP_FILE}"

  if [ $? -eq 0 ]; then
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    echo -e "${GREEN}✅ 압축 완료!${NC}"
    echo -e "   압축 파일: ${COMPRESSED_FILE}"
    echo -e "   압축 크기: ${COMPRESSED_SIZE}"
    echo ""

    # 백업 파일 정보 출력
    echo -e "${BLUE}==============================================================${NC}"
    echo -e "${GREEN}✅ 백업 성공!${NC}"
    echo -e "${BLUE}==============================================================${NC}"
    echo ""
    echo -e "${GREEN}📁 백업 파일 위치:${NC}"
    echo -e "   ${COMPRESSED_FILE}"
    echo ""

    # 최근 5개 백업만 유지
    echo -e "${YELLOW}🧹 오래된 백업 정리 중...${NC}"
    cd "${BACKUP_DIR}"
    ls -t consulton_backup_*.sql.gz | tail -n +6 | xargs -r rm
    REMAINING_BACKUPS=$(ls -1 consulton_backup_*.sql.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ 정리 완료! (현재 ${REMAINING_BACKUPS}개 백업 유지)${NC}"
    echo ""

    # 백업 목록 표시
    echo -e "${BLUE}📋 현재 백업 목록:${NC}"
    ls -lh consulton_backup_*.sql.gz | awk '{printf "   %s %s - %s\n", $6, $7, $9}'

  else
    echo -e "${RED}❌ 압축 실패${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ 백업 실패${NC}"
  echo ""
  echo -e "${YELLOW}해결 방법:${NC}"
  echo -e "   1. MySQL 서버가 실행 중인지 확인하세요"
  echo -e "   2. 데이터베이스 접속 정보가 올바른지 확인하세요"
  echo -e "   3. 백업 디렉토리 권한을 확인하세요"
  exit 1
fi

echo ""
echo -e "${BLUE}==============================================================${NC}"
echo -e "${GREEN}🎉 백업 프로세스 완료!${NC}"
echo -e "${BLUE}==============================================================${NC}"