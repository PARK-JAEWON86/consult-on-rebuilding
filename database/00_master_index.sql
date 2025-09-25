-- ==============================================
-- 00. MASTER INDEX - 데이터베이스 초기화 스크립트
-- ==============================================
-- 전체 데이터베이스 구조와 실행 순서 안내
-- 생성일: 2025-09-20

-- ==============================================
-- 실행 순서 (EXECUTION ORDER)
-- ==============================================
-- 다음 순서대로 SQL 파일들을 실행하세요:

-- 1. 기본 데이터 (Core Data)
-- SOURCE database/01_categories.sql;          -- 상담 카테고리 (26개)
-- SOURCE database/02_users.sql;               -- 사용자 데이터 (56명: 관리자1, 전문가30, 클라이언트25)
-- SOURCE database/03_experts.sql;             -- 전문가 상세정보 (30명)

-- 2. 사용자 관련 데이터 (User Related Data)
-- SOURCE database/04_ai_usage.sql;            -- AI 사용량 데이터
-- SOURCE database/05_expert_profiles.sql;     -- 전문가 프로필 및 가용시간

-- 3. 상담 관련 데이터 (Consultation Data)
-- SOURCE database/06_consultations.sql;       -- 상담 정보 및 세션
-- SOURCE database/07_reviews.sql;             -- 리뷰 및 평가

-- 4. 결제 관련 데이터 (Payment Data)
-- SOURCE database/08_payments.sql;            -- 결제 및 결제수단

-- 5. 시스템 데이터 (System Data)
-- SOURCE database/09_notifications.sql;       -- 알림 및 시스템 데이터
-- SOURCE database/10_payment_methods.sql;     -- 결제 수단 데이터
-- SOURCE database/11_consultation_sessions.sql; -- 상담 세션 데이터

-- 6. 확장 데이터 (Extended Data)
-- SOURCE database/12_consultation_summaries.sql; -- 상담 요약 데이터
-- SOURCE database/14_community_data.sql;      -- 커뮤니티 게시글, 댓글, 좋아요
-- SOURCE database/15_expert_categories.sql;   -- 전문가-카테고리 연결 테이블
-- SOURCE database/16_reservations.sql;        -- 예약 데이터

-- ==============================================
-- 파일별 상세 정보 (FILE DETAILS)
-- ==============================================

/*
01_categories.sql
- 테이블: Category
- 레코드 수: 26개
- 내용: 상담 분야별 카테고리 (Prisma 호환, slug/nameKo/nameEn)
- 의존성: 없음

02_users.sql
- 테이블: User
- 레코드 수: 56개 (관리자 1명, 전문가 30명, 클라이언트 25명)
- 내용: 전체 사용자 기본 정보 (Prisma 호환)
- 의존성: 없음

03_experts.sql
- 테이블: Expert
- 레코드 수: 30개
- 내용: 전문가 상세 정보 및 상담 통계 (Prisma 호환)
- 의존성: User 테이블 필요

04_ai_usage.sql
- 테이블: AIUsage
- 레코드 수: AI 사용량 ~56개
- 내용: AI 사용량 기본 통계 (Prisma 호환)
- 의존성: User 테이블 필요

05_expert_profiles.sql
- 테이블: expert_profiles, expert_availability
- 레코드 수: 프로필 30개, 가용시간 140개
- 내용: 전문가 프로필 상세 및 주간 스케줄
- 의존성: experts 테이블 필요

06_consultations.sql
- 테이블: consultations, consultation_sessions, consultation_summaries
- 레코드 수: 상담 ~40개, 세션 ~160개, 요약 ~30개
- 내용: 상담 예약, 세션 진행, 상담 요약
- 의존성: users, experts, categories 테이블 필요

07_reviews.sql
- 테이블: reviews
- 레코드 수: 40개
- 내용: 상담 완료 후 리뷰 및 평점
- 의존성: consultations 테이블 필요

08_payments.sql
- 테이블: payments, payment_methods
- 레코드 수: 결제 60개, 결제수단 80개
- 내용: 상담비 결제, 크레딧 구매 결제, 사용자별 결제수단
- 의존성: consultations, users 테이블 필요

09_notifications.sql
- 테이블: notifications
- 레코드 수: 80개
- 내용: 시스템 알림 (상담 예약, 결제, 리뷰 등)
- 의존성: users 테이블 필요

10_payment_methods.sql
- 테이블: payment_methods
- 레코드 수: ~80개
- 내용: 사용자별 결제 수단 정보
- 의존성: users 테이블 필요

11_consultation_sessions.sql
- 테이블: consultation_sessions
- 레코드 수: ~160개
- 내용: 상담 세션 진행 내역
- 의존성: consultations 테이블 필요

12_consultation_summaries.sql
- 테이블: consultation_summaries
- 레코드 수: ~12개
- 내용: 상담 완료 후 요약 및 할일 관리
- 의존성: consultations 테이블 필요

14_community_data.sql
- 테이블: community_posts, community_comments, community_likes
- 레코드 수: 게시글 16개, 댓글 39개, 좋아요 195개
- 내용: 커뮤니티 게시글, 댓글, 좋아요 시스템
- 의존성: users 테이블 필요

15_expert_categories.sql
- 테이블: ExpertCategory
- 레코드 수: 60개 연결
- 내용: 전문가-카테고리 N:N 관계 매핑
- 의존성: experts, categories 테이블 필요

16_reservations.sql
- 테이블: Reservation
- 레코드 수: 40개
- 내용: 사용자 예약 데이터 (확정/대기/취소)
- 의존성: users, experts 테이블 필요
*/

-- ==============================================
-- 전체 데이터 통계 (TOTAL STATISTICS)
-- ==============================================
/*
총 테이블 수: 15개
총 레코드 수: 약 800개
총 사용자 수: 56명
- 관리자: 1명
- 전문가: 30명
- 클라이언트: 25명

상담 카테고리: 26개
완료된 상담: ~40건
커뮤니티 활동: 게시글 ~40개, 댓글 ~60개
*/

-- ==============================================
-- 주의사항 (IMPORTANT NOTES)
-- ==============================================
/*
1. 외래키 제약 조건
   - 파일 실행 순서를 반드시 지켜주세요
   - 의존성이 있는 테이블은 참조 테이블 생성 후 실행

2. 데이터 일관성
   - userId는 users.id를 참조
   - expertId는 experts.id를 참조
   - categoryId는 categories.id를 참조

3. 날짜/시간 데이터
   - 모든 타임스탬프는 KST(Asia/Seoul) 기준
   - NOW() 함수 사용으로 실행 시점 기준 생성

4. 암호화된 데이터
   - 사용자 비밀번호는 bcrypt로 해시화됨
   - 테스트용 비밀번호: 'password123'

5. JSON 데이터
   - interestedCategories, languages 등은 JSON 배열 형태
   - MySQL 5.7+ 또는 PostgreSQL 지원 필요
*/

-- ==============================================
-- 빠른 실행 스크립트 (QUICK EXECUTION)
-- ==============================================
/*
전체 데이터를 한 번에 로드하려면:

SOURCE database/01_categories.sql;
SOURCE database/02_users.sql;
SOURCE database/03_experts.sql;
SOURCE database/04_ai_usage.sql;
SOURCE database/05_expert_profiles.sql;
SOURCE database/06_consultations.sql;
SOURCE database/07_reviews.sql;
SOURCE database/08_payments.sql;
SOURCE database/09_notifications.sql;
SOURCE database/10_payment_methods.sql;
SOURCE database/11_consultation_sessions.sql;
SOURCE database/12_consultation_summaries.sql;
SOURCE database/14_community_data.sql;
SOURCE database/15_expert_categories.sql;
SOURCE database/16_reservations.sql;
*/