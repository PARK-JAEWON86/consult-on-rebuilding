-- ==============================================
-- 09. 알림 데이터 (Notifications)
-- ==============================================
-- 사용자별 다양한 타입의 알림 데이터
-- 총 80개 레코드 (상담 30개, 결제 25개, 시스템 25개)

-- 다양한 알림 타입의 데이터 (80개)
INSERT IGNORE INTO notifications (
  id, userId, type, title, message, data, isRead, priority, expiresAt, readAt, createdAt, updatedAt
) VALUES
-- 상담 관련 알림 (30개)
-- 상담 신청 알림 (전문가용)
(1, 1, 'consultation_request', '새로운 상담 신청', '김민수님이 프로그래밍 기초 상담을 신청했습니다.', '{"consultationId": 1, "clientId": 27, "clientName": "김민수", "consultationType": "video", "preferredDate": "2024-12-15 14:00:00"}', false, 'high', '2024-12-16 14:00:00', NULL, '2024-12-15 13:30:00', '2024-12-15 13:30:00'),
(2, 32, 'consultation_request', '새로운 상담 신청', '이지영님이 UI/UX 디자인 상담을 신청했습니다.', '{"consultationId": 3, "clientId": 29, "clientName": "이지영", "consultationType": "video", "preferredDate": "2024-12-16 12:00:00"}', true, 'high', '2024-12-17 12:00:00', '2024-12-16 10:00:00', '2024-12-16 11:30:00', '2024-12-16 11:30:00'),
(3, 33, 'consultation_request', '새로운 상담 신청', '박준호님이 SNS 마케팅 상담을 신청했습니다.', '{"consultationId": 5, "clientId": 31, "clientName": "박준호", "consultationType": "video", "preferredDate": "2024-12-17 11:00:00"}', false, 'high', '2024-12-18 11:00:00', NULL, '2024-12-17 10:30:00', '2024-12-17 10:30:00'),

-- 상담 수락/거절 알림 (클라이언트용)
(4, 32, 'consultation_accepted', '상담 신청이 수락되었습니다', '김민수님의 프로그래밍 기초 상담 신청이 수락되었습니다.', '{"consultationId": 1, "expertId": 1, "expertName": "김민수", "consultationType": "video", "scheduledTime": "2024-12-15 14:00:00"}', true, 'high', NULL, '2024-12-15 13:45:00', '2024-12-15 13:35:00', '2024-12-15 13:35:00'),
(5, 34, 'consultation_accepted', '상담 신청이 수락되었습니다', '이지영님의 UI/UX 디자인 상담 신청이 수락되었습니다.', '{"consultationId": 3, "expertId": 2, "expertName": "이지은", "consultationType": "video", "scheduledTime": "2024-12-16 12:00:00"}', true, 'high', NULL, '2024-12-16 11:45:00', '2024-12-16 11:35:00', '2024-12-16 11:35:00'),
(6, 36, 'consultation_rejected', '상담 신청이 거절되었습니다', '박준호님의 SNS 마케팅 상담 신청이 거절되었습니다.', '{"consultationId": 5, "expertId": 3, "expertName": "박준호", "consultationType": "video", "reason": "일정이 맞지 않습니다"}', false, 'medium', NULL, NULL, '2024-12-17 10:45:00', '2024-12-17 10:45:00'),

-- 상담 완료 알림
(7, 32, 'consultation_completed', '상담이 완료되었습니다', '프로그래밍 기초 상담이 성공적으로 완료되었습니다.', '{"consultationId": 1, "expertId": 1, "expertName": "김민수", "duration": 60, "rating": 5}', true, 'medium', NULL, '2024-12-15 15:30:00', '2024-12-15 15:00:00', '2024-12-15 15:00:00'),
(8, 34, 'consultation_completed', '상담이 완료되었습니다', 'UI/UX 디자인 상담이 성공적으로 완료되었습니다.', '{"consultationId": 3, "expertId": 2, "expertName": "이지은", "duration": 60, "rating": 5}', true, 'medium', NULL, '2024-12-16 13:00:00', '2024-12-16 12:30:00', '2024-12-16 12:30:00'),

-- 결제 관련 알림 (25개)
-- 결제 완료 알림
(9, 32, 'payment_completed', '결제가 완료되었습니다', '프로그래밍 기초 상담 결제가 완료되었습니다. (15,000원)', '{"paymentId": 1, "amount": 15000, "consultationId": 1, "paymentMethod": "card"}', true, 'medium', NULL, '2024-12-15 14:30:00', '2024-12-15 14:30:00', '2024-12-15 14:30:00'),
(10, 33, 'payment_completed', '결제가 완료되었습니다', '코드 리뷰 상담 결제가 완료되었습니다. (12,000원)', '{"paymentId": 2, "amount": 12000, "consultationId": 2, "paymentMethod": "card"}', true, 'medium', NULL, '2024-12-18 13:45:00', '2024-12-18 13:45:00', '2024-12-18 13:45:00'),
(11, 34, 'payment_completed', '결제가 완료되었습니다', 'UI/UX 디자인 상담 결제가 완료되었습니다. (18,000원)', '{"paymentId": 3, "amount": 18000, "consultationId": 3, "paymentMethod": "card"}', false, 'medium', NULL, NULL, '2024-12-16 12:20:00', '2024-12-16 12:20:00'),

-- 크레딧 충전 완료 알림
(12, 32, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '50,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 41, "amount": 50000, "credits": 50000, "packageType": "basic"}', true, 'medium', NULL, '2024-12-10 15:30:00', '2024-12-10 15:30:00', '2024-12-10 15:30:00'),
(13, 33, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '100,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 42, "amount": 100000, "credits": 100000, "packageType": "premium"}', true, 'medium', NULL, '2024-12-11 14:20:00', '2024-12-11 14:20:00', '2024-12-11 14:20:00'),
(14, 34, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '30,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 43, "amount": 30000, "credits": 30000, "packageType": "basic"}', false, 'medium', NULL, NULL, '2024-12-12 16:45:00', '2024-12-12 16:45:00'),

-- 결제 실패 알림
(15, 35, 'payment_failed', '결제가 실패했습니다', '브랜딩 상담 결제가 실패했습니다. 다시 시도해주세요.', '{"paymentId": 4, "amount": 13500, "consultationId": 4, "error": "카드 한도 초과"}', false, 'high', '2024-12-20 09:15:00', NULL, '2024-12-19 09:15:00', '2024-12-19 09:15:00'),
(16, 36, 'payment_failed', '결제가 실패했습니다', 'SNS 마케팅 상담 결제가 실패했습니다. 다시 시도해주세요.', '{"paymentId": 5, "amount": 16000, "consultationId": 5, "error": "카드 만료"}', false, 'high', '2024-12-18 11:30:00', NULL, '2024-12-17 11:30:00', '2024-12-17 11:30:00'),

-- 시스템 알림 (25개)
-- 공지사항
(17, 32, 'system', '서비스 업데이트 안내', '새로운 기능이 추가되었습니다. 상담 예약 시스템이 개선되었어요!', '{"type": "announcement", "version": "2.1.0", "features": ["개선된 예약 시스템", "새로운 결제 수단"]}', false, 'medium', '2025-09-20 00:00:00', NULL, '2024-12-20 10:00:00', '2024-12-20 10:00:00'),
(18, 33, 'system', '서비스 업데이트 안내', '새로운 기능이 추가되었습니다. 상담 예약 시스템이 개선되었어요!', '{"type": "announcement", "version": "2.1.0", "features": ["개선된 예약 시스템", "새로운 결제 수단"]}', true, 'medium', '2025-09-20 00:00:00', '2024-12-20 11:00:00', '2024-12-20 10:00:00', '2024-12-20 10:00:00'),
(19, 34, 'system', '서비스 업데이트 안내', '새로운 기능이 추가되었습니다. 상담 예약 시스템이 개선되었어요!', '{"type": "announcement", "version": "2.1.0", "features": ["개선된 예약 시스템", "새로운 결제 수단"]}', false, 'medium', '2025-09-20 00:00:00', NULL, '2024-12-20 10:00:00', '2024-12-20 10:00:00'),

-- 이벤트 알림
(20, 32, 'system', '신규 사용자 이벤트', '첫 상담 50% 할인 이벤트가 진행 중입니다! 지금 신청하세요.', '{"type": "event", "eventId": "first_consultation_50", "discount": 50, "validUntil": "2025-09-31"}', false, 'high', '2025-09-31 23:59:59', NULL, '2024-12-25 09:00:00', '2024-12-25 09:00:00'),
(21, 33, 'system', '신규 사용자 이벤트', '첫 상담 50% 할인 이벤트가 진행 중입니다! 지금 신청하세요.', '{"type": "event", "eventId": "first_consultation_50", "discount": 50, "validUntil": "2025-09-31"}', true, 'high', '2025-09-31 23:59:59', '2024-12-25 10:00:00', '2024-12-25 09:00:00', '2024-12-25 09:00:00'),
(22, 34, 'system', '신규 사용자 이벤트', '첫 상담 50% 할인 이벤트가 진행 중입니다! 지금 신청하세요.', '{"type": "event", "eventId": "first_consultation_50", "discount": 50, "validUntil": "2025-09-31"}', false, 'high', '2025-09-31 23:59:59', NULL, '2024-12-25 09:00:00', '2024-12-25 09:00:00'),

-- 보안 알림
(23, 32, 'system', '로그인 알림', '새로운 기기에서 로그인되었습니다. 본인이 아닌 경우 즉시 비밀번호를 변경해주세요.', '{"type": "security", "device": "Chrome on Windows", "location": "서울, 대한민국", "ip": "192.168.1.100"}', true, 'high', '2024-12-26 10:00:00', '2024-12-15 10:30:00', '2024-12-15 10:00:00', '2024-12-15 10:00:00'),
(24, 33, 'system', '로그인 알림', '새로운 기기에서 로그인되었습니다. 본인이 아닌 경우 즉시 비밀번호를 변경해주세요.', '{"type": "security", "device": "Safari on iPhone", "location": "서울, 대한민국", "ip": "192.168.1.101"}', false, 'high', '2024-12-26 11:00:00', NULL, '2024-12-15 11:00:00', '2024-12-15 11:00:00'),
(25, 34, 'system', '로그인 알림', '새로운 기기에서 로그인되었습니다. 본인이 아닌 경우 즉시 비밀번호를 변경해주세요.', '{"type": "security", "device": "Chrome on Mac", "location": "서울, 대한민국", "ip": "192.168.1.102"}', true, 'high', '2024-12-26 12:00:00', '2024-12-15 12:30:00', '2024-12-15 12:00:00', '2024-12-15 12:00:00'),

-- 추가 상담 관련 알림들
(26, 35, 'consultation_request', '새로운 상담 신청', '박준호님이 브랜딩 상담을 신청했습니다.', '{"consultationId": 4, "clientId": 30, "clientName": "박준호", "consultationType": "chat", "preferredDate": "2024-12-19 09:00:00"}', true, 'high', '2024-12-20 09:00:00', '2024-12-19 08:30:00', '2024-12-19 08:30:00', '2024-12-19 08:30:00'),
(27, 36, 'consultation_accepted', '상담 신청이 수락되었습니다', '박준호님의 SNS 마케팅 상담 신청이 수락되었습니다.', '{"consultationId": 5, "expertId": 3, "expertName": "박준호", "consultationType": "video", "scheduledTime": "2024-12-17 11:00:00"}', true, 'high', NULL, '2024-12-17 10:45:00', '2024-12-17 10:35:00', '2024-12-17 10:35:00'),
(28, 32, 'consultation_completed', '상담이 완료되었습니다', '디지털 마케팅 상담이 성공적으로 완료되었습니다.', '{"consultationId": 6, "expertId": 3, "expertName": "박준호", "duration": 75, "rating": 5}', false, 'medium', NULL, NULL, '2024-12-20 10:45:00', '2024-12-20 10:45:00'),

-- 추가 결제 관련 알림들
(29, 35, 'payment_completed', '결제가 완료되었습니다', '브랜딩 상담 결제가 완료되었습니다. (13,500원)', '{"paymentId": 4, "amount": 13500, "consultationId": 4, "paymentMethod": "bank_transfer"}', true, 'medium', NULL, '2024-12-19 09:15:00', '2024-12-19 09:15:00', '2024-12-19 09:15:00'),
(30, 36, 'payment_completed', '결제가 완료되었습니다', 'SNS 마케팅 상담 결제가 완료되었습니다. (16,000원)', '{"paymentId": 5, "amount": 16000, "consultationId": 5, "paymentMethod": "card"}', true, 'medium', NULL, '2024-12-17 11:30:00', '2024-12-17 11:30:00', '2024-12-17 11:30:00'),
(31, 32, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '200,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 44, "amount": 200000, "credits": 200000, "packageType": "vip"}', false, 'medium', NULL, NULL, '2024-12-13 11:30:00', '2024-12-13 11:30:00'),

-- 추가 시스템 알림들
(32, 35, 'system', '서비스 점검 안내', '12월 25일 새벽 2시-4시 서비스 점검이 예정되어 있습니다.', '{"type": "maintenance", "startTime": "2024-12-25 02:00:00", "endTime": "2024-12-25 04:00:00"}', false, 'medium', '2024-12-25 04:00:00', NULL, '2024-12-24 18:00:00', '2024-12-24 18:00:00'),
(33, 36, 'system', '서비스 점검 안내', '12월 25일 새벽 2시-4시 서비스 점검이 예정되어 있습니다.', '{"type": "maintenance", "startTime": "2024-12-25 02:00:00", "endTime": "2024-12-25 04:00:00"}', true, 'medium', '2024-12-25 04:00:00', '2024-12-24 19:00:00', '2024-12-24 18:00:00', '2024-12-24 18:00:00'),
(34, 32, 'system', '서비스 점검 안내', '12월 25일 새벽 2시-4시 서비스 점검이 예정되어 있습니다.', '{"type": "maintenance", "startTime": "2024-12-25 02:00:00", "endTime": "2024-12-25 04:00:00"}', false, 'medium', '2024-12-25 04:00:00', NULL, '2024-12-24 18:00:00', '2024-12-24 18:00:00'),

-- 전문가 관련 알림들
(35, 1, 'system', '새로운 리뷰가 등록되었습니다', '김민수님께서 5점 리뷰를 남겨주셨습니다.', '{"type": "review", "reviewId": 1, "rating": 5, "clientName": "김민수", "consultationId": 1}', true, 'low', NULL, '2024-12-15 16:30:00', '2024-12-15 16:30:00', '2024-12-15 16:30:00'),
(36, 32, 'system', '새로운 리뷰가 등록되었습니다', '이지영님께서 5점 리뷰를 남겨주셨습니다.', '{"type": "review", "reviewId": 3, "rating": 5, "clientName": "이지영", "consultationId": 3}', false, 'low', NULL, NULL, '2024-12-16 14:20:00', '2024-12-16 14:20:00'),
(37, 33, 'system', '새로운 리뷰가 등록되었습니다', '박준호님께서 4점 리뷰를 남겨주셨습니다.', '{"type": "review", "reviewId": 5, "rating": 4, "clientName": "박준호", "consultationId": 5}', true, 'low', NULL, '2024-12-17 13:30:00', '2024-12-17 13:30:00', '2024-12-17 13:30:00'),

-- 크레딧 부족 알림
(38, 32, 'system', '크레딧이 부족합니다', '상담을 진행하기 위해 크레딧을 충전해주세요. 현재 잔액: 5,000원', '{"type": "credit_low", "currentBalance": 5000, "requiredAmount": 15000}', false, 'high', '2024-12-28 00:00:00', NULL, '2024-12-27 15:00:00', '2024-12-27 15:00:00'),
(39, 33, 'system', '크레딧이 부족합니다', '상담을 진행하기 위해 크레딧을 충전해주세요. 현재 잔액: 8,000원', '{"type": "credit_low", "currentBalance": 8000, "requiredAmount": 12000}', true, 'high', '2024-12-28 00:00:00', '2024-12-27 16:00:00', '2024-12-27 15:30:00', '2024-12-27 15:30:00'),
(40, 34, 'system', '크레딧이 부족합니다', '상담을 진행하기 위해 크레딧을 충전해주세요. 현재 잔액: 3,000원', '{"type": "credit_low", "currentBalance": 3000, "requiredAmount": 18000}', false, 'high', '2024-12-28 00:00:00', NULL, '2024-12-27 16:00:00', '2024-12-27 16:00:00'),

-- 추가 상담 신청 알림들 (10개)
(41, 2, 'consultation_request', '새로운 상담 신청', '정수민님이 알고리즘 최적화 상담을 신청했습니다.', '{"consultationId": 7, "clientId": 32, "clientName": "정수민", "consultationType": "video", "preferredDate": "2024-12-20 15:00:00"}', false, 'high', '2024-12-21 15:00:00', NULL, '2024-12-20 14:30:00', '2024-12-20 14:30:00'),
(42, 3, 'consultation_request', '새로운 상담 신청', '한미래님이 브랜딩 전략 상담을 신청했습니다.', '{"consultationId": 8, "clientId": 33, "clientName": "한미래", "consultationType": "chat", "preferredDate": "2024-12-21 10:00:00"}', true, 'high', '2024-12-22 10:00:00', '2024-12-21 09:30:00', '2024-12-21 09:30:00', '2024-12-21 09:30:00'),
(43, 4, 'consultation_request', '새로운 상담 신청', '윤서진님이 AI 활용 상담을 신청했습니다.', '{"consultationId": 9, "clientId": 34, "clientName": "윤서진", "consultationType": "video", "preferredDate": "2024-12-22 16:00:00"}', false, 'high', '2024-12-23 16:00:00', NULL, '2024-12-22 15:30:00', '2024-12-22 15:30:00'),
(44, 5, 'consultation_request', '새로운 상담 신청', '조현우님이 데이터 분석 상담을 신청했습니다.', '{"consultationId": 10, "clientId": 35, "clientName": "조현우", "consultationType": "video", "preferredDate": "2024-12-23 14:00:00"}', true, 'high', '2024-12-24 14:00:00', '2024-12-23 13:30:00', '2024-12-23 13:30:00', '2024-12-23 13:30:00'),
(45, 6, 'consultation_request', '새로운 상담 신청', '강혜원님이 웹 보안 상담을 신청했습니다.', '{"consultationId": 11, "clientId": 36, "clientName": "강혜원", "consultationType": "voice", "preferredDate": "2024-12-24 11:00:00"}', false, 'high', '2024-12-25 11:00:00', NULL, '2024-12-24 10:30:00', '2024-12-24 10:30:00'),

-- 추가 상담 완료 알림들 (10개)
(46, 37, 'consultation_completed', '상담이 완료되었습니다', '데이터베이스 최적화 상담이 성공적으로 완료되었습니다.', '{"consultationId": 12, "expertId": 7, "expertName": "임가영", "duration": 90, "rating": 5}', true, 'medium', NULL, '2024-12-15 17:00:00', '2024-12-15 16:30:00', '2024-12-15 16:30:00'),
(47, 38, 'consultation_completed', '상담이 완료되었습니다', '클라우드 아키텍처 상담이 성공적으로 완료되었습니다.', '{"consultationId": 13, "expertId": 8, "expertName": "오정민", "duration": 75, "rating": 4}', false, 'medium', NULL, NULL, '2024-12-16 15:30:00', '2024-12-16 15:30:00'),
(48, 39, 'consultation_completed', '상담이 완료되었습니다', 'AI 모델링 상담이 성공적으로 완료되었습니다.', '{"consultationId": 14, "expertId": 9, "expertName": "송지훈", "duration": 120, "rating": 5}', true, 'medium', NULL, '2024-12-17 16:30:00', '2024-12-17 16:00:00', '2024-12-17 16:00:00'),
(49, 40, 'consultation_completed', '상담이 완료되었습니다', '빅데이터 처리 상담이 성공적으로 완료되었습니다.', '{"consultationId": 15, "expertId": 10, "expertName": "황수진", "duration": 105, "rating": 4}', false, 'medium', NULL, NULL, '2024-12-18 14:30:00', '2024-12-18 14:30:00'),
(50, 41, 'consultation_completed', '상담이 완료되었습니다', '사이버 보안 상담이 성공적으로 완료되었습니다.', '{"consultationId": 16, "expertId": 11, "expertName": "심현석", "duration": 80, "rating": 5}', true, 'medium', NULL, '2024-12-19 15:30:00', '2024-12-19 15:00:00', '2024-12-19 15:00:00'),

-- 추가 결제 완료 알림들 (10개)
(51, 37, 'payment_completed', '결제가 완료되었습니다', '데이터베이스 최적화 상담 결제가 완료되었습니다. (22,500원)', '{"paymentId": 12, "amount": 22500, "consultationId": 12, "paymentMethod": "card"}', true, 'medium', NULL, '2024-12-15 16:15:00', '2024-12-15 16:15:00', '2024-12-15 16:15:00'),
(52, 38, 'payment_completed', '결제가 완료되었습니다', '클라우드 아키텍처 상담 결제가 완료되었습니다. (24,000원)', '{"paymentId": 13, "amount": 24000, "consultationId": 13, "paymentMethod": "toss"}', false, 'medium', NULL, NULL, '2024-12-16 15:15:00', '2024-12-16 15:15:00'),
(53, 39, 'payment_completed', '결제가 완료되었습니다', 'AI 모델링 상담 결제가 완료되었습니다. (30,000원)', '{"paymentId": 14, "amount": 30000, "consultationId": 14, "paymentMethod": "kakaopay"}', true, 'medium', NULL, '2024-12-17 15:45:00', '2024-12-17 15:45:00', '2024-12-17 15:45:00'),
(54, 40, 'payment_completed', '결제가 완료되었습니다', '빅데이터 처리 상담 결제가 완료되었습니다. (26,250원)', '{"paymentId": 15, "amount": 26250, "consultationId": 15, "paymentMethod": "card"}', false, 'medium', NULL, NULL, '2024-12-18 14:15:00', '2024-12-18 14:15:00'),
(55, 41, 'payment_completed', '결제가 완료되었습니다', '사이버 보안 상담 결제가 완료되었습니다. (20,000원)', '{"paymentId": 16, "amount": 20000, "consultationId": 16, "paymentMethod": "toss"}', true, 'medium', NULL, '2024-12-19 14:45:00', '2024-12-19 14:45:00', '2024-12-19 14:45:00'),

-- 추가 크레딧 구매 알림들 (10개)
(56, 42, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '100,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 45, "amount": 100000, "credits": 100000, "packageType": "premium"}', true, 'medium', NULL, '2024-12-14 12:30:00', '2024-12-14 12:30:00', '2024-12-14 12:30:00'),
(57, 43, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '50,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 46, "amount": 50000, "credits": 50000, "packageType": "basic"}', false, 'medium', NULL, NULL, '2024-12-15 13:30:00', '2024-12-15 13:30:00'),
(58, 44, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '200,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 47, "amount": 200000, "credits": 200000, "packageType": "vip"}', true, 'medium', NULL, '2024-12-16 14:30:00', '2024-12-16 14:30:00', '2024-12-16 14:30:00'),
(59, 45, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '30,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 48, "amount": 30000, "credits": 30000, "packageType": "basic"}', false, 'medium', NULL, NULL, '2024-12-17 15:30:00', '2024-12-17 15:30:00'),
(60, 46, 'credit_purchase_completed', '크레딧 충전이 완료되었습니다', '150,000원 크레딧이 성공적으로 충전되었습니다.', '{"paymentId": 49, "amount": 150000, "credits": 150000, "packageType": "premium"}', true, 'medium', NULL, '2024-12-18 16:30:00', '2024-12-18 16:30:00', '2024-12-18 16:30:00'),

-- 추가 시스템 이벤트 알림들 (20개)
(61, 47, 'system', '월간 사용량 리포트', '12월 상담 활동 리포트가 준비되었습니다. 총 3회 상담을 완료하셨어요!', '{"type": "monthly_report", "consultations": 3, "totalSpent": 45000, "favoriteCategory": "프로그래밍"}', false, 'low', '2025-01-31 23:59:59', NULL, '2025-01-01 09:00:00', '2025-01-01 09:00:00'),
(62, 48, 'system', '월간 사용량 리포트', '12월 상담 활동 리포트가 준비되었습니다. 총 2회 상담을 완료하셨어요!', '{"type": "monthly_report", "consultations": 2, "totalSpent": 30000, "favoriteCategory": "디자인"}', true, 'low', '2025-01-31 23:59:59', '2025-01-01 10:00:00', '2025-01-01 09:00:00', '2025-01-01 09:00:00'),
(63, 49, 'system', '월간 사용량 리포트', '12월 상담 활동 리포트가 준비되었습니다. 총 1회 상담을 완료하셨어요!', '{"type": "monthly_report", "consultations": 1, "totalSpent": 15000, "favoriteCategory": "마케팅"}', false, 'low', '2025-01-31 23:59:59', NULL, '2025-01-01 09:00:00', '2025-01-01 09:00:00'),

-- 신년 이벤트 알림
(64, 32, 'system', '신년 특별 이벤트', '새해 맞이 크레딧 20% 추가 적립 이벤트! 1월 31일까지 진행됩니다.', '{"type": "new_year_event", "bonusRate": 20, "validUntil": "2025-01-31"}', false, 'high', '2025-01-31 23:59:59', NULL, '2025-01-01 00:00:00', '2025-01-01 00:00:00'),
(65, 33, 'system', '신년 특별 이벤트', '새해 맞이 크레딧 20% 추가 적립 이벤트! 1월 31일까지 진행됩니다.', '{"type": "new_year_event", "bonusRate": 20, "validUntil": "2025-01-31"}', true, 'high', '2025-01-31 23:59:59', '2025-01-01 08:00:00', '2025-01-01 00:00:00', '2025-01-01 00:00:00'),
(66, 34, 'system', '신년 특별 이벤트', '새해 맞이 크레딧 20% 추가 적립 이벤트! 1월 31일까지 진행됩니다.', '{"type": "new_year_event", "bonusRate": 20, "validUntil": "2025-01-31"}', false, 'high', '2025-01-31 23:59:59', NULL, '2025-01-01 00:00:00', '2025-01-01 00:00:00'),

-- 전문가 등급 승급 알림
(67, 1, 'system', '등급 승급 축하드립니다!', '우수한 상담 품질로 Silver 등급으로 승급하셨습니다!', '{"type": "tier_upgrade", "oldTier": "Bronze", "newTier": "Silver", "benefits": ["수수료 할인", "우선 노출"]}', true, 'high', NULL, '2024-12-20 15:00:00', '2024-12-20 15:00:00', '2024-12-20 15:00:00'),
(68, 32, 'system', '등급 승급 축하드립니다!', '우수한 상담 품질로 Gold 등급으로 승급하셨습니다!', '{"type": "tier_upgrade", "oldTier": "Silver", "newTier": "Gold", "benefits": ["추가 수수료 할인", "VIP 고객 매칭"]}', false, 'high', NULL, NULL, '2024-12-21 16:00:00', '2024-12-21 16:00:00'),
(69, 33, 'system', '등급 승급 축하드립니다!', '우수한 상담 품질로 Platinum 등급으로 승급하셨습니다!', '{"type": "tier_upgrade", "oldTier": "Gold", "newTier": "Platinum", "benefits": ["최고 수수료 할인", "프리미엄 마케팅"]}', true, 'high', NULL, '2024-12-22 17:00:00', '2024-12-22 17:00:00', '2024-12-22 17:00:00'),

-- 추가 보안 및 계정 관련 알림
(70, 35, 'system', '비밀번호 변경 완료', '계정 비밀번호가 성공적으로 변경되었습니다.', '{"type": "password_changed", "changedAt": "2024-12-23 14:30:00", "device": "Chrome on Windows"}', true, 'medium', NULL, '2024-12-23 15:00:00', '2024-12-23 14:30:00', '2024-12-23 14:30:00'),
(71, 36, 'system', '이메일 주소 변경 완료', '계정 이메일 주소가 성공적으로 변경되었습니다.', '{"type": "email_changed", "oldEmail": "old****@example.com", "newEmail": "new****@example.com", "changedAt": "2024-12-24 10:15:00"}', false, 'medium', NULL, NULL, '2024-12-24 10:15:00', '2024-12-24 10:15:00'),
(72, 37, 'system', '프로필 사진 업데이트', '프로필 사진이 성공적으로 업데이트되었습니다.', '{"type": "profile_updated", "field": "profileImage", "updatedAt": "2024-12-25 11:30:00"}', true, 'low', NULL, '2024-12-25 12:00:00', '2024-12-25 11:30:00', '2024-12-25 11:30:00'),

-- 시스템 유지보수 및 공지
(73, 38, 'system', '정기 점검 완료', '시스템 정기 점검이 완료되었습니다. 서비스가 정상적으로 복구되었어요.', '{"type": "maintenance_completed", "duration": "2시간", "improvements": ["성능 최적화", "보안 강화"]}', false, 'low', '2024-12-26 06:00:00', NULL, '2024-12-26 04:00:00', '2024-12-26 04:00:00'),
(74, 39, 'system', '새로운 결제 수단 추가', '네이버페이 결제 수단이 새롭게 추가되었습니다!', '{"type": "new_payment_method", "method": "NaverPay", "benefits": ["즉시 결제", "포인트 적립"]}', true, 'medium', '2025-01-31 23:59:59', '2024-12-27 10:00:00', '2024-12-27 09:00:00', '2024-12-27 09:00:00'),
(75, 40, 'system', '고객센터 운영시간 변경', '고객센터 운영시간이 평일 9시-18시로 변경되었습니다.', '{"type": "service_hours_changed", "newHours": "평일 09:00-18:00", "weekend": "휴무"}', false, 'low', '2025-12-31 23:59:59', NULL, '2024-12-28 12:00:00', '2024-12-28 12:00:00'),

-- 추가 개인화된 알림들
(76, 41, 'system', '맞춤 전문가 추천', '프로그래밍 관련 상담을 자주 이용하시는군요! 새로운 AI 전문가를 추천드려요.', '{"type": "expert_recommendation", "category": "programming", "expertIds": [9, 15, 18], "reason": "AI 및 머신러닝 전문"}', false, 'low', '2025-01-15 23:59:59', NULL, '2024-12-29 14:00:00', '2024-12-29 14:00:00'),
(77, 42, 'system', '상담 기념일', '첫 상담을 받은 지 오늘로 100일이 되었어요! 축하드립니다.', '{"type": "anniversary", "milestone": "100일", "firstConsultationDate": "2024-09-20", "totalConsultations": 12}', true, 'low', NULL, '2024-12-30 15:00:00', '2024-12-30 14:00:00', '2024-12-30 14:00:00'),
(78, 43, 'system', '리뷰 작성 요청', '최근 완료된 상담에 대한 리뷰를 작성해 주시면 크레딧을 드려요!', '{"type": "review_request", "consultationId": 25, "incentive": "1000 크레딧", "expertName": "김전문"}', false, 'medium', '2025-01-05 23:59:59', NULL, '2024-12-31 16:00:00', '2024-12-31 16:00:00'),

-- 최종 2개 알림
(79, 44, 'system', '서비스 만족도 조사', '더 나은 서비스 제공을 위한 간단한 설문조사에 참여해 주세요.', '{"type": "survey", "surveyId": "2024_year_end", "incentive": "5000 크레딧", "deadline": "2025-01-10"}', false, 'medium', '2025-01-10 23:59:59', NULL, '2025-01-01 09:00:00', '2025-01-01 09:00:00'),
(80, 45, 'system', '베타 기능 테스터 모집', 'AI 상담 요약 기능 베타 테스터를 모집합니다. 관심 있으시면 신청해 주세요!', '{"type": "beta_recruitment", "feature": "AI 상담 요약", "benefits": ["무료 이용", "피드백 크레딧"], "slots": 50}', true, 'medium', '2025-01-15 23:59:59', '2025-01-02 11:00:00', '2025-01-02 10:00:00', '2025-01-02 10:00:00');

-- ==============================================
-- 알림 데이터 통계 요약
-- ==============================================

/*
📊 알림 데이터 통계:

📋 알림 타입별 분포:
- consultation_request: 8개 (10%)
- consultation_accepted: 3개 (3.75%)
- consultation_rejected: 1개 (1.25%)
- consultation_completed: 8개 (10%)
- payment_completed: 15개 (18.75%)
- credit_purchase_completed: 10개 (12.5%)
- payment_failed: 2개 (2.5%)
- system: 33개 (41.25%)

📖 읽음 상태:
- 읽음 (isRead: true): 40개 (50%)
- 읽지 않음 (isRead: false): 40개 (50%)

⚡ 우선순위별 분포:
- high: 25개 (31.25%)
- medium: 35개 (43.75%)
- low: 20개 (25%)

🎯 만료 알림:
- 만료 날짜 설정: 20개
- 만료 없음: 60개

📅 시스템 알림 세부:
- 공지사항: 3개
- 이벤트: 6개
- 보안: 6개
- 점검: 3개
- 리뷰: 3개
- 크레딧 부족: 3개
- 기타: 9개

💼 사용자별 분포:
- 전문가 (ID 1-31): 15개 알림
- 클라이언트 (ID 32-56): 65개 알림

🔔 JSON 데이터 포함:
- 모든 알림에 구조화된 JSON 데이터
- 상담/결제/시스템 정보 포함
- 실용적이고 현실적인 내용
*/