-- ==============================================
-- 02. 사용자 데이터 (Users) - Prisma 스키마 준수
-- ==============================================
-- 관리자, 전문가, 클라이언트 사용자 데이터
-- 총 56명 (관리자 1명, 전문가 30명, 클라이언트 25명)

-- 사용자 데이터 입력 (56명) - Prisma 스키마 준수
INSERT INTO User (
    id, email, name, passwordHash, provider, providerId, avatarUrl, roles, emailVerifiedAt, createdAt, updatedAt
) VALUES
-- 관리자 (1명)
(1, 'admin@consult-on.kr', '관리자', '$2b$10$LEDDmb.Gx5fcjGVygpI28.be50/yvFMkuCnixbxTvSgiD/kPU.5K2', 'local', NULL, NULL, '["ADMIN"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 09:00:00'),

-- 전문가 (30명) - 모두 EXPERT 역할
(2, 'expert1@consult-on.kr', '김민지', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 08:30:00'),
(3, 'expert2@consult-on.kr', '이준호', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 08:00:00'),
(4, 'expert3@consult-on.kr', '박서준', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 07:45:00'),
(5, 'expert4@consult-on.kr', '최유진', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 07:30:00'),
(6, 'expert5@consult-on.kr', '정민수', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 07:15:00'),
(7, 'expert6@consult-on.kr', '강태현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 07:00:00'),
(8, 'expert7@consult-on.kr', '윤서연', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 06:45:00'),
(9, 'expert8@consult-on.kr', '임지훈', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 06:30:00'),
(10, 'expert9@consult-on.kr', '한소영', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 06:15:00'),
(11, 'expert10@consult-on.kr', '조현우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 06:00:00'),
(12, 'expert11@consult-on.kr', '김다은', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 05:45:00'),
(13, 'expert12@consult-on.kr', '이채원', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 05:30:00'),
(14, 'expert13@consult-on.kr', '박준영', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 05:15:00'),
(15, 'expert14@consult-on.kr', '최하은', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 05:00:00'),
(16, 'expert15@consult-on.kr', '정승우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 04:45:00'),
(17, 'expert16@consult-on.kr', '강민준', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 04:30:00'),
(18, 'expert17@consult-on.kr', '윤재현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 04:15:00'),
(19, 'expert18@consult-on.kr', '임소은', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 04:00:00'),
(20, 'expert19@consult-on.kr', '한지윤', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 03:45:00'),
(21, 'expert20@consult-on.kr', '조아름', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 03:30:00'),
(22, 'expert21@consult-on.kr', '김도현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 03:15:00'),
(23, 'expert22@consult-on.kr', '이서우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 03:00:00'),
(24, 'expert23@consult-on.kr', '박시우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 02:45:00'),
(25, 'expert24@consult-on.kr', '최나연', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 02:30:00'),
(26, 'expert25@consult-on.kr', '정우진', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 02:15:00'),
(27, 'expert26@consult-on.kr', '강서연', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 02:00:00'),
(28, 'expert27@consult-on.kr', '윤민재', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 01:45:00'),
(29, 'expert28@consult-on.kr', '임지현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 01:30:00'),
(30, 'expert29@consult-on.kr', '한준서', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 01:15:00'),
(31, 'expert30@consult-on.kr', '조예린', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["EXPERT"]', '2025-09-01 00:00:00', '2025-09-01 00:00:00', '2025-09-20 01:00:00'),

-- 클라이언트 (25명) - 모두 USER 역할
(32, 'user1@consult-on.kr', '김민수', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 10:00:00'),
(33, 'user2@consult-on.kr', '이지영', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 09:45:00'),
(34, 'user3@consult-on.kr', '박준호', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 09:30:00'),
(35, 'user4@consult-on.kr', '최수진', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 09:15:00'),
(36, 'user5@consult-on.kr', '정현우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 09:00:00'),
(37, 'user6@consult-on.kr', '정수민', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 08:45:00'),
(38, 'user7@consult-on.kr', '한미래', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 08:30:00'),
(39, 'user8@consult-on.kr', '윤서진', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 08:15:00'),
(40, 'user9@consult-on.kr', '조현우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 08:00:00'),
(41, 'user10@consult-on.kr', '강혜원', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 07:45:00'),
(42, 'user11@consult-on.kr', '김태현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 07:30:00'),
(43, 'user12@consult-on.kr', '송민지', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 07:15:00'),
(44, 'user13@consult-on.kr', '이동민', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 07:00:00'),
(45, 'user14@consult-on.kr', '박소영', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 06:45:00'),
(46, 'user15@consult-on.kr', '최준혁', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 06:30:00'),
(47, 'user16@consult-on.kr', '김예린', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 06:15:00'),
(48, 'user17@consult-on.kr', '정우진', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 06:00:00'),
(49, 'user18@consult-on.kr', '송하은', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 05:45:00'),
(50, 'user19@consult-on.kr', '이건우', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 05:30:00'),
(51, 'user20@consult-on.kr', '박채윤', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 05:15:00'),
(52, 'user21@consult-on.kr', '김성현', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 05:00:00'),
(53, 'user22@consult-on.kr', '이민호', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 04:45:00'),
(54, 'user23@consult-on.kr', '박지원', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 04:30:00'),
(55, 'user24@consult-on.kr', '최하은', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 04:15:00'),
(56, 'user25@consult-on.kr', '정민호', '$2b$10$oSK1Yqxx8XsHWl14BzWTJuNUQSbry5sGUJbUH3EwX.hqiL.k1WeJK', 'local', NULL, NULL, '["USER"]', '2025-09-10 10:00:00', '2025-09-10 10:00:00', '2025-09-20 04:00:00');

-- ==============================================
-- 사용자 데이터 통계 요약 (Prisma 스키마 준수)
-- ==============================================

/*
📊 사용자 데이터 통계:

👥 사용자 역할별 분포:
- ADMIN: 1명 (1.8%)
- EXPERT: 30명 (53.6%)
- USER: 25명 (44.6%)

🔐 인증 정보:
- 모든 사용자 local 인증 방식
- 모든 사용자 이메일 인증 완료
- passwordHash: bcrypt 해시 사용

📧 이메일 도메인:
- 관리자: admin@consult-on.kr
- 전문가: expert{n}@consult-on.kr
- 클라이언트: user{n}@consult-on.kr

🎯 Prisma 스키마 준수:
- User 테이블명 (대문자)
- roles JSON 배열 형태
- provider/providerId OAuth 대비
- emailVerifiedAt DateTime 형태
- passwordHash 필드명

⚠️ 주요 변경사항:
- 기존 password → passwordHash
- 기존 role (string) → roles (JSON array)
- 기존 isEmailVerified → emailVerifiedAt
- 기존 테이블명 users → User
- 추가 필드: provider, providerId, avatarUrl
*/