#!/bin/bash

# ==============================================
# 데이터베이스 복원 스크립트
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

echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}  데이터베이스 복원${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo ""

# 백업 파일 목록 확인
if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR}/*.sql.gz 2>/dev/null)" ]; then
  echo -e "${RED}❌ 백업 파일이 없습니다.${NC}"
  echo -e "   먼저 ./backup-database.sh 를 실행하여 백업을 생성하세요."
  exit 1
fi

# 백업 파일 목록 표시
echo -e "${GREEN}📋 사용 가능한 백업 파일:${NC}"
echo ""
BACKUPS=($(ls -t ${BACKUP_DIR}/consulton_backup_*.sql.gz))
INDEX=1
for backup in "${BACKUPS[@]}"; do
  BACKUP_DATE=$(echo $backup | grep -oP '\d{8}_\d{6}')
  BACKUP_SIZE=$(du -h "$backup" | cut -f1)
  FORMATTED_DATE=$(echo $BACKUP_DATE | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
  echo -e "   ${BLUE}[$INDEX]${NC} $FORMATTED_DATE - $BACKUP_SIZE"
  INDEX=$((INDEX + 1))
done
echo ""

# 복원할 파일 선택
if [ -z "$1" ]; then
  echo -e "${YELLOW}복원할 백업 번호를 입력하세요 (기본값: 1 - 최신 백업):${NC}"
  read -p "선택: " CHOICE
  CHOICE=${CHOICE:-1}
else
  CHOICE=$1
fi

# 선택 검증
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt ${#BACKUPS[@]} ]; then
  echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
  exit 1
fi

SELECTED_BACKUP=${BACKUPS[$((CHOICE - 1))]}
echo ""
echo -e "${GREEN}선택된 백업:${NC} $(basename $SELECTED_BACKUP)"
echo ""

# 최종 확인
echo -e "${RED}⚠️  경고: 현재 데이터베이스의 모든 데이터가 삭제되고 백업으로 복원됩니다!${NC}"
echo -e "${YELLOW}계속하시겠습니까? (yes/no):${NC}"
read -p "> " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}복원이 취소되었습니다.${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}==============================================================${NC}"
echo -e "${BLUE}  복원 시작${NC}"
echo -e "${BLUE}==============================================================${NC}"
echo ""

# 임시 디렉토리 생성
TEMP_DIR=$(mktemp -d)
TEMP_SQL="${TEMP_DIR}/restore.sql"

# 압축 해제
echo -e "${YELLOW}📦 압축 해제 중...${NC}"
gunzip -c "${SELECTED_BACKUP}" > "${TEMP_SQL}"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ 압축 해제 실패${NC}"
  rm -rf "${TEMP_DIR}"
  exit 1
fi

echo -e "${GREEN}✅ 압축 해제 완료${NC}"
echo ""

# 데이터베이스 복원
echo -e "${YELLOW}⏳ 데이터베이스 복원 중...${NC}"
/usr/local/mysql/bin/mysql \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --user="${DB_USER}" \
  --password="${DB_PASSWORD}" \
  < "${TEMP_SQL}" 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 복원 완료!${NC}"
  echo ""

  # 복원 후 데이터 확인
  echo -e "${YELLOW}📊 데이터베이스 상태 확인 중...${NC}"
  TABLE_COUNT=$(/usr/local/mysql/bin/mysql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASSWORD}" \
    --skip-column-names \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB_NAME}';" 2>/dev/null)

  echo -e "${GREEN}✅ 테이블 개수: ${TABLE_COUNT}${NC}"
  echo ""

  # 임시 파일 정리
  rm -rf "${TEMP_DIR}"

  echo -e "${BLUE}==============================================================${NC}"
  echo -e "${GREEN}🎉 복원 완료!${NC}"
  echo -e "${BLUE}==============================================================${NC}"
  echo ""
  echo -e "${GREEN}✅ 데이터베이스가 성공적으로 복원되었습니다.${NC}"
  echo -e "   복원된 백업: $(basename $SELECTED_BACKUP)"

else
  echo -e "${RED}❌ 복원 실패${NC}"
  rm -rf "${TEMP_DIR}"
  echo ""
  echo -e "${YELLOW}해결 방법:${NC}"
  echo -e "   1. MySQL 서버가 실행 중인지 확인하세요"
  echo -e "   2. 데이터베이스 접속 정보가 올바른지 확인하세요"
  echo -e "   3. 백업 파일이 손상되지 않았는지 확인하세요"
  exit 1
fi

echo ""
echo -e "${BLUE}==============================================================${NC}"