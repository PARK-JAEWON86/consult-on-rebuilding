# 데이터베이스 백업 및 복원 가이드

## 📦 백업

### 자동 백업 실행

```bash
./backup-database.sh
```

### 백업 내용

- **데이터베이스**: consulton_dev
- **포함 항목**:
  - 모든 테이블 데이터
  - 스키마 구조
  - 트리거, 프로시저, 이벤트
  - Foreign Key 관계

### 백업 파일 위치

```
database/backups/consulton_backup_YYYYMMDD_HHMMSS.sql.gz
```

예시:
```
database/backups/consulton_backup_20250930_170022.sql.gz
```

### 백업 관리

- 자동으로 최근 5개 백업만 유지
- 오래된 백업은 자동 삭제
- Gzip 압축으로 용량 절약 (약 80% 압축)

### 백업 예시

```bash
$ ./backup-database.sh

==============================================================
  데이터베이스 백업 시작
==============================================================

📊 백업 정보:
   데이터베이스: consulton_dev
   호스트: localhost:3306
   백업 파일: ./database/backups/consulton_backup_20250930_170022.sql

⏳ 백업 진행 중...
✅ 백업 완료!
   파일 크기: 532K

🗜️  압축 진행 중...
✅ 압축 완료!
   압축 파일: ./database/backups/consulton_backup_20250930_170022.sql.gz
   압축 크기: 108K

✅ 백업 성공!
```

---

## 🔄 복원

### 복원 스크립트 실행

```bash
./restore-database.sh
```

### 복원 프로세스

1. 사용 가능한 백업 파일 목록 표시
2. 복원할 백업 선택
3. 확인 메시지 (yes 입력 필요)
4. 데이터베이스 복원
5. 복원 결과 확인

### 복원 예시

```bash
$ ./restore-database.sh

==============================================================
  데이터베이스 복원
==============================================================

📋 사용 가능한 백업 파일:

   [1] 2025-09-30 17:00:22 - 108K
   [2] 2025-09-29 15:30:15 - 105K
   [3] 2025-09-28 10:20:45 - 102K

복원할 백업 번호를 입력하세요 (기본값: 1 - 최신 백업):
선택: 1

선택된 백업: consulton_backup_20250930_170022.sql.gz

⚠️  경고: 현재 데이터베이스의 모든 데이터가 삭제되고 백업으로 복원됩니다!
계속하시겠습니까? (yes/no):
> yes

==============================================================
  복원 시작
==============================================================

📦 압축 해제 중...
✅ 압축 해제 완료

⏳ 데이터베이스 복원 중...
✅ 복원 완료!

📊 데이터베이스 상태 확인 중...
✅ 테이블 개수: 22

🎉 복원 완료!
```

### 특정 백업 복원

```bash
# 두 번째 백업 복원
./restore-database.sh 2

# 세 번째 백업 복원
./restore-database.sh 3
```

---

## ⚠️ 주의사항

### 백업 전

1. **MySQL 서버 실행 확인**
   ```bash
   mysql.server status
   ```

2. **디스크 공간 확인**
   ```bash
   df -h
   ```

3. **데이터베이스 접속 확인**
   ```bash
   mysql -u consulton -p consulton_dev
   ```

### 복원 전

1. **⚠️ 복원은 현재 데이터를 완전히 삭제합니다!**
2. 복원 전 반드시 현재 데이터베이스를 백업하세요
3. 복원할 백업 파일이 정확한지 확인하세요
4. 프로덕션 환경에서는 더욱 신중하게!

---

## 🔧 수동 백업/복원

### 수동 백업

```bash
mysqldump \
  --host=localhost \
  --port=3306 \
  --user=consulton \
  --password=password \
  --databases consulton_dev \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  > backup.sql

# 압축
gzip backup.sql
```

### 수동 복원

```bash
# 압축 해제
gunzip backup.sql.gz

# 복원
mysql \
  --host=localhost \
  --port=3306 \
  --user=consulton \
  --password=password \
  < backup.sql
```

---

## 📊 백업 스케줄링 (선택사항)

### Cron으로 자동 백업 설정

```bash
# crontab 편집
crontab -e

# 매일 오전 3시에 백업
0 3 * * * cd /Users/jaewon/project/Consutl-On-re && ./backup-database.sh >> /tmp/db-backup.log 2>&1

# 매주 일요일 오전 2시에 백업
0 2 * * 0 cd /Users/jaewon/project/Consutl-On-re && ./backup-database.sh >> /tmp/db-backup.log 2>&1
```

---

## 🐛 문제 해결

### 백업 실패

**에러**: `mysqldump: command not found`
```bash
# mysqldump 경로 확인
which mysqldump

# 스크립트의 mysqldump 경로 수정
# /usr/local/mysql/bin/mysqldump
```

**에러**: `Access denied for user`
```bash
# .env 파일의 DATABASE_URL 확인
cat .env | grep DATABASE_URL

# 비밀번호 확인
mysql -u consulton -p
```

**에러**: `Can't connect to MySQL server`
```bash
# MySQL 서버 시작
mysql.server start

# 상태 확인
mysql.server status
```

### 복원 실패

**에러**: `Unknown database`
```bash
# 데이터베이스 생성
mysql -u consulton -p -e "CREATE DATABASE IF NOT EXISTS consulton_dev;"
```

**에러**: `Disk full`
```bash
# 디스크 공간 확인
df -h

# 오래된 백업 수동 삭제
rm database/backups/consulton_backup_20250101_*.sql.gz
```

---

## 📝 백업 파일 정보

### 파일 구조

```
database/backups/
├── consulton_backup_20250930_170022.sql.gz  (최신)
├── consulton_backup_20250929_153015.sql.gz
├── consulton_backup_20250928_102045.sql.gz
├── consulton_backup_20250927_093030.sql.gz
└── consulton_backup_20250926_081520.sql.gz  (가장 오래됨)
```

### 백업 파일 내용

- DROP DATABASE 및 CREATE DATABASE 문
- CREATE TABLE 문
- INSERT INTO 문 (모든 데이터)
- CREATE TRIGGER 문
- CREATE PROCEDURE/FUNCTION 문
- CREATE EVENT 문

---

## ✅ 권장 사항

1. **정기적인 백업**
   - 개발 환경: 매일 또는 주요 작업 전
   - 스테이징 환경: 매일
   - 프로덕션 환경: 매일 + 배포 전

2. **백업 테스트**
   - 월 1회 복원 테스트 수행
   - 백업 파일 무결성 확인

3. **백업 저장**
   - 로컬 백업: 최근 5개
   - 외부 저장소: 클라우드 스토리지에 추가 백업

4. **문서화**
   - 백업/복원 절차 숙지
   - 팀원들과 공유

---

## 📞 문의

백업/복원 관련 문제가 발생하면:

1. 이 문서의 "문제 해결" 섹션 참조
2. MySQL 로그 확인: `/usr/local/mysql/data/*.err`
3. 스크립트 로그 확인