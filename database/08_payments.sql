-- ==============================================
-- 08. 결제 데이터 (Payments)
-- ==============================================
-- 상담 결제 및 크레딧 구매 결제 정보
-- 총 60개 결제 레코드 (상담 결제 40개 + 크레딧 구매 20개)

-- 상담 결제 및 크레딧 구매 결제 데이터 (60개)
INSERT IGNORE INTO payments (
  id, userId, consultationId, paymentType, amount, currency, status,
  paymentMethod, paymentProvider, transactionId, orderId, description,
  metadata, processedAt, createdAt, updatedAt
) VALUES
-- 상담 결제 데이터 (40개 - 완료된 상담에 대한 결제)
-- 김민지 (expertId: 1) - 심리상담 전문가
(1, 32, 1, 'consultation', 24000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250910_001', 'ORD_20250910_001', '스트레스 관리 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 650}', '2025-09-10 14:30:00', '2025-09-10 14:00:00', '2025-09-10 14:30:00'),
(2, 33, 2, 'consultation', 18000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250912_002', 'ORD_20250912_002', '대인관계 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 650}', '2025-09-12 10:30:00', '2025-09-12 10:00:00', '2025-09-12 10:30:00'),

-- 이준호 (expertId: 2) - 법률상담 전문가
(3, 35, 4, 'consultation', 30000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250911_003', 'ORD_20250911_003', '계약서 검토 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 750}', '2025-09-11 16:30:00', '2025-09-11 16:00:00', '2025-09-11 16:30:00'),
(4, 36, 5, 'consultation', 37500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250913_004', 'ORD_20250913_004', '상속 문제 상담 결제', '{"consultationType": "chat", "duration": 75, "expertLevel": 750}', '2025-09-13 12:15:00', '2025-09-13 11:00:00', '2025-09-13 12:15:00'),

-- 박서준 (expertId: 3) - 재무상담 전문가
(5, 38, 7, 'consultation', 21000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250909_005', 'ORD_20250909_005', '투자 포트폴리오 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 550}', '2025-09-09 16:00:00', '2025-09-09 15:30:00', '2025-09-09 16:00:00'),
(6, 39, 8, 'consultation', 26250, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250919_006', 'ORD_20250919_006', '자산관리 상담 결제', '{"consultationType": "chat", "duration": 75, "expertLevel": 550}', '2025-09-19 15:15:00', '2025-09-19 14:00:00', '2025-09-19 15:15:00'),

-- 최유진 (expertId: 4) - 건강상담 전문가
(7, 41, 10, 'consultation', 18000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250908_007', 'ORD_20250908_007', '체중관리 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 450}', '2025-09-08 12:00:00', '2025-09-08 11:00:00', '2025-09-08 12:00:00'),
(8, 42, 11, 'consultation', 13500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250912_008', 'ORD_20250912_008', '운동처방 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 450}', '2025-09-12 15:45:00', '2025-09-12 15:00:00', '2025-09-12 15:45:00'),

-- 정민수 (expertId: 5) - 진로상담 전문가
(9, 44, 13, 'consultation', 29250, 'KRW', 'completed', 'card', 'toss', 'TXN_20250907_009', 'ORD_20250907_009', '취업준비 상담 결제', '{"consultationType": "video", "duration": 90, "expertLevel": 480}', '2025-09-07 16:00:00', '2025-09-07 14:30:00', '2025-09-07 16:00:00'),
(10, 45, 14, 'consultation', 19500, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250911_010', 'ORD_20250911_010', '이직 상담 결제', '{"consultationType": "chat", "duration": 60, "expertLevel": 480}', '2025-09-11 11:00:00', '2025-09-11 10:00:00', '2025-09-11 11:00:00'),

-- 김태환 (expertId: 6) - IT상담 전문가
(11, 47, 16, 'consultation', 22500, 'KRW', 'completed', 'card', 'toss', 'TXN_20250906_011', 'ORD_20250906_011', '웹개발 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 600}', '2025-09-06 17:00:00', '2025-09-06 16:00:00', '2025-09-06 17:00:00'),
(12, 48, 17, 'consultation', 16875, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250910_012', 'ORD_20250910_012', '데이터베이스 설계 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 600}', '2025-09-10 09:45:00', '2025-09-10 09:00:00', '2025-09-10 09:45:00'),

-- 이수연 (expertId: 7) - 디자인상담 전문가
(13, 50, 19, 'consultation', 20625, 'KRW', 'completed', 'card', 'toss', 'TXN_20250905_013', 'ORD_20250905_013', 'UI/UX 디자인 상담 결제', '{"consultationType": "video", "duration": 75, "expertLevel": 380}', '2025-09-05 16:15:00', '2025-09-05 15:00:00', '2025-09-05 16:15:00'),
(14, 51, 20, 'consultation', 16500, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250909_014', 'ORD_20250909_014', '브랜딩 상담 결제', '{"consultationType": "chat", "duration": 60, "expertLevel": 380}', '2025-09-09 12:00:00', '2025-09-09 11:00:00', '2025-09-09 12:00:00'),

-- 박동훈 (expertId: 8) - 사업상담 전문가
(15, 53, 22, 'consultation', 38250, 'KRW', 'completed', 'card', 'toss', 'TXN_20250904_015', 'ORD_20250904_015', '창업 상담 결제', '{"consultationType": "video", "duration": 90, "expertLevel": 680}', '2025-09-04 16:00:00', '2025-09-04 14:30:00', '2025-09-04 16:00:00'),
(16, 54, 23, 'consultation', 25500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250908_016', 'ORD_20250908_016', '마케팅 전략 상담 결제', '{"consultationType": "chat", "duration": 60, "expertLevel": 680}', '2025-09-08 17:00:00', '2025-09-08 16:00:00', '2025-09-08 17:00:00'),

-- 김나영 (expertId: 9) - 언어상담 전문가
(17, 56, 25, 'consultation', 15000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250903_017', 'ORD_20250903_017', '영어 회화 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 320}', '2025-09-03 20:00:00', '2025-09-03 19:00:00', '2025-09-03 20:00:00'),
(18, 32, 26, 'consultation', 11250, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250907_018', 'ORD_20250907_018', '중국어 학습 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 320}', '2025-09-07 20:45:00', '2025-09-07 20:00:00', '2025-09-07 20:45:00'),

-- 장민호 (expertId: 10) - 음악상담 전문가
(19, 34, 28, 'consultation', 27000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250902_019', 'ORD_20250902_019', '피아노 레슨 상담 결제', '{"consultationType": "video", "duration": 90, "expertLevel": 420}', '2025-09-02 21:30:00', '2025-09-02 20:00:00', '2025-09-02 21:30:00'),
(20, 35, 29, 'consultation', 18000, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250906_020', 'ORD_20250906_020', '작곡 상담 결제', '{"consultationType": "chat", "duration": 60, "expertLevel": 420}', '2025-09-06 22:00:00', '2025-09-06 21:00:00', '2025-09-06 22:00:00'),

-- 윤지혜 (expertId: 11) - 여행상담 전문가 (실제로는 교육)
(21, 32, 31, 'consultation', 19500, 'KRW', 'completed', 'card', 'toss', 'TXN_20250901_021', 'ORD_20250901_021', '학습법 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 500}', '2025-09-01 15:00:00', '2025-09-01 14:00:00', '2025-09-01 15:00:00'),
(22, 33, 32, 'consultation', 24375, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250905_022', 'ORD_20250905_022', '진로교육 상담 결제', '{"consultationType": "chat", "duration": 75, "expertLevel": 500}', '2025-09-05 11:15:00', '2025-09-05 10:00:00', '2025-09-05 11:15:00'),

-- 한소라 (expertId: 12) - 미용상담 전문가 (실제로는 부동산)
(23, 35, 34, 'consultation', 21000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241230_023', 'ORD_20241230_023', '부동산 투자 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 480}', '2024-12-30 16:00:00', '2024-12-30 15:00:00', '2024-12-30 16:00:00'),
(24, 36, 35, 'consultation', 15750, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250902_024', 'ORD_20250902_024', '아파트 매매 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 480}', '2025-09-02 11:45:00', '2025-09-02 11:00:00', '2025-09-02 11:45:00'),

-- 조성민 (expertId: 13) - 스포츠상담 전문가 (실제로는 패션)
(25, 38, 37, 'consultation', 16500, 'KRW', 'completed', 'card', 'toss', 'TXN_20241229_025', 'ORD_20241229_025', '스타일링 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 360}', '2024-12-29 17:00:00', '2024-12-29 16:00:00', '2024-12-29 17:00:00'),
(26, 39, 38, 'consultation', 12375, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250901_026', 'ORD_20250901_026', '이미지 메이킹 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 360}', '2025-09-01 12:45:00', '2025-09-01 12:00:00', '2025-09-01 12:45:00'),

-- 신영수 (expertId: 14) - 원예상담 전문가 (실제로는 운동)
(27, 41, 40, 'consultation', 18000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241228_027', 'ORD_20241228_027', '헬스 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 420}', '2024-12-28 19:00:00', '2024-12-28 18:00:00', '2024-12-28 19:00:00'),
(28, 42, 41, 'consultation', 13500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20241231_028', 'ORD_20241231_028', '다이어트 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 420}', '2024-12-31 19:45:00', '2024-12-31 19:00:00', '2024-12-31 19:45:00'),

-- 배현우 (expertId: 15) - 투자상담 전문가 (실제로는 요리)
(29, 44, 43, 'consultation', 15000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241227_029', 'ORD_20241227_029', '요리법 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 300}', '2024-12-27 14:00:00', '2024-12-27 13:00:00', '2024-12-27 14:00:00'),
(30, 45, 44, 'consultation', 11250, 'KRW', 'completed', 'card', 'kakao', 'TXN_20241230_030', 'ORD_20241230_030', '영양 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 300}', '2024-12-30 12:45:00', '2024-12-30 12:00:00', '2024-12-30 12:45:00'),

-- 오미나 (expertId: 16) - 영상상담 전문가 (실제로는 인간관계)
(31, 47, 46, 'consultation', 18000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241226_031', 'ORD_20241226_031', '대인관계 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 400}', '2024-12-26 16:00:00', '2024-12-26 15:00:00', '2024-12-26 16:00:00'),
(32, 48, 47, 'consultation', 13500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20241229_032', 'ORD_20241229_032', '소통 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 400}', '2024-12-29 11:45:00', '2024-12-29 11:00:00', '2024-12-29 11:45:00'),

-- 송지훈 (expertId: 17) - 쇼핑상담 전문가 (실제로는 마케팅)
(33, 50, 49, 'consultation', 21000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241225_033', 'ORD_20241225_033', '디지털 마케팅 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 450}', '2024-12-25 15:00:00', '2024-12-25 14:00:00', '2024-12-25 15:00:00'),
(34, 51, 50, 'consultation', 15750, 'KRW', 'completed', 'card', 'kakao', 'TXN_20241228_034', 'ORD_20241228_034', '브랜딩 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 450}', '2024-12-28 10:45:00', '2024-12-28 10:00:00', '2024-12-28 10:45:00'),

-- 강은비 (expertId: 18) - 요리상담 전문가 (실제로는 여행)
(35, 53, 52, 'consultation', 15000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241224_035', 'ORD_20241224_035', '여행 계획 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 280}', '2024-12-24 17:00:00', '2024-12-24 16:00:00', '2024-12-24 17:00:00'),
(36, 54, 53, 'consultation', 11250, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20241227_036', 'ORD_20241227_036', '관광지 추천 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 280}', '2024-12-27 15:45:00', '2024-12-27 15:00:00', '2024-12-27 15:45:00'),

-- 임도현 (expertId: 19) - 반려동물상담 전문가 (실제로는 육아)
(37, 56, 55, 'consultation', 18000, 'KRW', 'completed', 'card', 'toss', 'TXN_20241223_037', 'ORD_20241223_037', '육아법 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 380}', '2024-12-23 15:00:00', '2024-12-23 14:00:00', '2024-12-23 15:00:00'),
(38, 55, 56, 'consultation', 13500, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20241226_038', 'ORD_20241226_038', '아동교육 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 380}', '2024-12-26 11:45:00', '2024-12-26 11:00:00', '2024-12-26 11:45:00'),

-- 노하린 (expertId: 20) - 부동산상담 전문가 (실제로는 스포츠)
(39, 53, 58, 'consultation', 19500, 'KRW', 'completed', 'card', 'toss', 'TXN_20241222_039', 'ORD_20241222_039', '축구 훈련 상담 결제', '{"consultationType": "video", "duration": 60, "expertLevel": 420}', '2024-12-22 19:00:00', '2024-12-22 18:00:00', '2024-12-22 19:00:00'),
(40, 52, 59, 'consultation', 14625, 'KRW', 'completed', 'card', 'kakao', 'TXN_20241225_040', 'ORD_20241225_040', '체력관리 상담 결제', '{"consultationType": "chat", "duration": 45, "expertLevel": 420}', '2024-12-25 19:45:00', '2024-12-25 19:00:00', '2024-12-25 19:45:00'),

-- 크레딧 구매 결제 데이터 (20개)
(41, 32, NULL, 'credit_purchase', 50000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250810_041', 'ORD_20250810_041', '크레딧 50,000원 충전', '{"credits": 50000, "packageType": "basic", "bonus": 0}', '2025-08-10 15:30:00', '2025-08-10 15:00:00', '2025-08-10 15:30:00'),
(42, 33, NULL, 'credit_purchase', 100000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250811_042', 'ORD_20250811_042', '크레딧 100,000원 충전', '{"credits": 100000, "packageType": "premium", "bonus": 10000}', '2025-08-11 14:20:00', '2025-08-11 14:00:00', '2025-08-11 14:20:00'),
(43, 34, NULL, 'credit_purchase', 30000, 'KRW', 'completed', 'bank_transfer', 'toss', 'TXN_20250812_043', 'ORD_20250812_043', '크레딧 30,000원 충전', '{"credits": 30000, "packageType": "basic", "bonus": 0}', '2025-08-12 16:45:00', '2025-08-12 16:15:00', '2025-08-12 16:45:00'),
(44, 35, NULL, 'credit_purchase', 200000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250813_044', 'ORD_20250813_044', '크레딧 200,000원 충전', '{"credits": 200000, "packageType": "vip", "bonus": 40000}', '2025-08-13 11:30:00', '2025-08-13 11:00:00', '2025-08-13 11:30:00'),
(45, 36, NULL, 'credit_purchase', 75000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250814_045', 'ORD_20250814_045', '크레딧 75,000원 충전', '{"credits": 75000, "packageType": "premium", "bonus": 7500}', '2025-08-14 13:15:00', '2025-08-14 12:45:00', '2025-08-14 13:15:00'),
(46, 37, NULL, 'credit_purchase', 40000, 'KRW', 'completed', 'virtual_account', 'kakao', 'TXN_20250815_046', 'ORD_20250815_046', '크레딧 40,000원 충전', '{"credits": 40000, "packageType": "basic", "bonus": 0}', '2025-08-15 10:20:00', '2025-08-15 09:50:00', '2025-08-15 10:20:00'),
(47, 38, NULL, 'credit_purchase', 150000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250816_047', 'ORD_20250816_047', '크레딧 150,000원 충전', '{"credits": 150000, "packageType": "vip", "bonus": 30000}', '2025-08-16 09:45:00', '2025-08-16 09:15:00', '2025-08-16 09:45:00'),
(48, 39, NULL, 'credit_purchase', 60000, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250817_048', 'ORD_20250817_048', '크레딧 60,000원 충전', '{"credits": 60000, "packageType": "premium", "bonus": 6000}', '2025-08-17 15:30:00', '2025-08-17 15:00:00', '2025-08-17 15:30:00'),
(49, 40, NULL, 'credit_purchase', 25000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250818_049', 'ORD_20250818_049', '크레딧 25,000원 충전', '{"credits": 25000, "packageType": "basic", "bonus": 0}', '2025-08-18 12:00:00', '2025-08-18 11:30:00', '2025-08-18 12:00:00'),
(50, 41, NULL, 'credit_purchase', 120000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250819_050', 'ORD_20250819_050', '크레딧 120,000원 충전', '{"credits": 120000, "packageType": "premium", "bonus": 12000}', '2025-08-19 14:15:00', '2025-08-19 13:45:00', '2025-08-19 14:15:00'),
(51, 42, NULL, 'credit_purchase', 35000, 'KRW', 'completed', 'virtual_account', 'toss', 'TXN_20250820_051', 'ORD_20250820_051', '크레딧 35,000원 충전', '{"credits": 35000, "packageType": "basic", "bonus": 0}', '2025-08-20 16:30:00', '2025-08-20 16:00:00', '2025-08-20 16:30:00'),
(52, 43, NULL, 'credit_purchase', 80000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250821_052', 'ORD_20250821_052', '크레딧 80,000원 충전', '{"credits": 80000, "packageType": "premium", "bonus": 8000}', '2025-08-21 11:45:00', '2025-08-21 11:15:00', '2025-08-21 11:45:00'),
(53, 44, NULL, 'credit_purchase', 180000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250822_053', 'ORD_20250822_053', '크레딧 180,000원 충전', '{"credits": 180000, "packageType": "vip", "bonus": 36000}', '2025-08-22 08:20:00', '2025-08-22 07:50:00', '2025-08-22 08:20:00'),
(54, 45, NULL, 'credit_purchase', 45000, 'KRW', 'completed', 'bank_transfer', 'kakao', 'TXN_20250823_054', 'ORD_20250823_054', '크레딧 45,000원 충전', '{"credits": 45000, "packageType": "basic", "bonus": 0}', '2025-08-23 17:15:00', '2025-08-23 16:45:00', '2025-08-23 17:15:00'),
(55, 46, NULL, 'credit_purchase', 90000, 'KRW', 'completed', 'card', 'toss', 'TXN_20250824_055', 'ORD_20250824_055', '크레딧 90,000원 충전', '{"credits": 90000, "packageType": "premium", "bonus": 9000}', '2025-08-24 13:30:00', '2025-08-24 13:00:00', '2025-08-24 13:30:00'),
(56, 47, NULL, 'credit_purchase', 55000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250825_056', 'ORD_20250825_056', '크레딧 55,000원 충전', '{"credits": 55000, "packageType": "premium", "bonus": 5500}', '2025-08-25 10:45:00', '2025-08-25 10:15:00', '2025-08-25 10:45:00'),
(57, 48, NULL, 'credit_purchase', 30000, 'KRW', 'completed', 'virtual_account', 'toss', 'TXN_20250826_057', 'ORD_20250826_057', '크레딧 30,000원 충전', '{"credits": 30000, "packageType": "basic", "bonus": 0}', '2025-08-26 14:20:00', '2025-08-26 13:50:00', '2025-08-26 14:20:00'),
(58, 49, NULL, 'credit_purchase', 110000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250827_058', 'ORD_20250827_058', '크레딧 110,000원 충전', '{"credits": 110000, "packageType": "premium", "bonus": 11000}', '2025-08-27 12:00:00', '2025-08-27 11:30:00', '2025-08-27 12:00:00'),
(59, 50, NULL, 'credit_purchase', 70000, 'KRW', 'completed', 'bank_transfer', 'toss', 'TXN_20250828_059', 'ORD_20250828_059', '크레딧 70,000원 충전', '{"credits": 70000, "packageType": "premium", "bonus": 7000}', '2025-08-28 15:45:00', '2025-08-28 15:15:00', '2025-08-28 15:45:00'),
(60, 51, NULL, 'credit_purchase', 25000, 'KRW', 'completed', 'card', 'kakao', 'TXN_20250829_060', 'ORD_20250829_060', '크레딧 25,000원 충전', '{"credits": 25000, "packageType": "basic", "bonus": 0}', '2025-08-29 11:30:00', '2025-08-29 11:00:00', '2025-08-29 11:30:00');

-- ==============================================
-- 결제수단 데이터 (Payment Methods)
-- ==============================================
-- 사용자별 등록된 결제수단 정보 (80개)

INSERT IGNORE INTO payment_methods (
  id, userId, type, provider, cardNumber, cardBrand, expiryDate,
  holderName, bankName, accountNumber, isDefault, isActive,
  createdAt, updatedAt
) VALUES
-- 관리자 및 전문가들의 결제수단 (31명)
(1, 1, 'card', 'toss', '****-****-****-1234', 'visa', '2028-12', '관리자', NULL, NULL, true, true, '2024-06-15 09:00:00', '2024-06-15 09:00:00'),
(2, 2, 'card', 'kakao', '****-****-****-5678', 'mastercard', '2027-11', '김민지', NULL, NULL, true, true, '2024-07-18 10:30:00', '2024-07-18 10:30:00'),
(3, 3, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '국민은행', '123-456-789012', true, true, '2024-05-20 14:20:00', '2024-05-20 14:20:00'),
(4, 4, 'card', 'kakao', '****-****-****-9012', 'visa', '2029-03', '박서준', NULL, NULL, true, true, '2024-08-10 11:45:00', '2024-08-10 11:45:00'),
(5, 5, 'virtual_account', 'toss', NULL, NULL, NULL, NULL, '신한은행', '987-654-321098', true, true, '2024-09-05 16:15:00', '2024-09-05 16:15:00'),
(6, 6, 'card', 'toss', '****-****-****-3456', 'samsung', '2026-08', '정민수', NULL, NULL, true, true, '2024-07-22 13:30:00', '2024-07-22 13:30:00'),
(7, 7, 'card', 'kakao', '****-****-****-7890', 'hyundai', '2028-05', '김태환', NULL, NULL, true, true, '2024-04-15 12:00:00', '2024-04-15 12:00:00'),
(8, 8, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '우리은행', '555-777-888999', true, true, '2024-10-12 15:45:00', '2024-10-12 15:45:00'),
(9, 9, 'card', 'kakao', '****-****-****-2468', 'lotte', '2027-09', '박동훈', NULL, NULL, true, true, '2024-03-08 09:30:00', '2024-03-08 09:30:00'),
(10, 10, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'NH농협', '111-222-333444', true, true, '2024-11-20 17:20:00', '2024-11-20 17:20:00'),
(11, 11, 'card', 'toss', '****-****-****-1357', 'kb', '2029-01', '장민호', NULL, NULL, true, true, '2024-08-30 14:10:00', '2024-08-30 14:10:00'),
(12, 12, 'card', 'kakao', '****-****-****-9753', 'visa', '2026-12', '윤지혜', NULL, NULL, true, true, '2024-12-05 11:25:00', '2024-12-05 11:25:00'),
(13, 13, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '하나은행', '666-888-999111', true, true, '2024-09-18 13:50:00', '2024-09-18 13:50:00'),
(14, 14, 'card', 'kakao', '****-****-****-8642', 'mastercard', '2028-07', '조성민', NULL, NULL, true, true, '2024-06-25 16:40:00', '2024-06-25 16:40:00'),
(15, 15, 'virtual_account', 'toss', NULL, NULL, NULL, NULL, 'IBK기업은행', '333-555-777888', true, true, '2024-10-08 12:35:00', '2024-10-08 12:35:00'),
(16, 16, 'card', 'kakao', '****-****-****-7531', 'samsung', '2027-04', '배현우', NULL, NULL, true, true, '2024-05-12 10:20:00', '2024-05-12 10:20:00'),
(17, 17, 'card', 'toss', '****-****-****-9517', 'hyundai', '2029-06', '오미나', NULL, NULL, true, true, '2024-08-15 15:55:00', '2024-08-15 15:55:00'),
(18, 18, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '우리은행', '777-999-111222', true, true, '2024-12-10 14:15:00', '2024-12-10 14:15:00'),
(19, 19, 'card', 'toss', '****-****-****-6420', 'lotte', '2026-10', '강은비', NULL, NULL, true, true, '2024-09-28 17:30:00', '2024-09-28 17:30:00'),
(20, 20, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, '신한은행', '444-666-888999', true, true, '2024-07-05 11:05:00', '2024-07-05 11:05:00'),
(21, 21, 'card', 'toss', '****-****-****-8531', 'kb', '2028-02', '노하린', NULL, NULL, true, true, '2024-04-20 13:45:00', '2024-04-20 13:45:00'),
(22, 22, 'card', 'kakao', '****-****-****-7419', 'visa', '2027-08', '허민지', NULL, NULL, true, true, '2024-10-15 16:20:00', '2024-10-15 16:20:00'),
(23, 23, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '국민은행', '888-111-333555', true, true, '2024-08-22 12:50:00', '2024-08-22 12:50:00'),
(24, 24, 'card', 'kakao', '****-****-****-5280', 'mastercard', '2029-05', '유재석', NULL, NULL, true, true, '2024-11-12 14:35:00', '2024-11-12 14:35:00'),
(25, 25, 'virtual_account', 'toss', NULL, NULL, NULL, NULL, 'NH농협', '222-444-666777', true, true, '2024-06-08 10:40:00', '2024-06-08 10:40:00'),
(26, 26, 'card', 'kakao', '****-****-****-3691', 'samsung', '2026-11', '김현지', NULL, NULL, true, true, '2024-12-20 15:25:00', '2024-12-20 15:25:00'),
(27, 27, 'card', 'toss', '****-****-****-1470', 'hyundai', '2028-09', '박서영', NULL, NULL, true, true, '2024-07-18 11:15:00', '2024-07-18 11:15:00'),
(28, 28, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '하나은행', '555-777-999111', true, true, '2024-05-25 13:00:00', '2024-05-25 13:00:00'),
(29, 29, 'card', 'toss', '****-****-****-2583', 'lotte', '2027-12', '안희진', NULL, NULL, true, true, '2024-09-10 16:45:00', '2024-09-10 16:45:00'),
(30, 30, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'IBK기업은행', '999-111-222333', true, true, '2024-08-05 12:30:00', '2024-08-05 12:30:00'),
(31, 31, 'card', 'toss', '****-****-****-9625', 'kb', '2029-03', '배소희', NULL, NULL, true, true, '2024-06-18 14:55:00', '2024-06-18 14:55:00'),

-- 클라이언트 사용자들의 결제수단 (25명 × 2개씩 = 50개, 총 81개)
(32, 32, 'card', 'toss', '****-****-****-4567', 'visa', '2027-06', '김철수', NULL, NULL, true, true, '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
(33, 32, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '국민은행', '123-456-789000', false, true, '2024-02-20 14:20:00', '2024-02-20 14:20:00'),
(34, 33, 'card', 'kakao', '****-****-****-8901', 'mastercard', '2028-04', '이영희', NULL, NULL, true, true, '2024-01-22 11:45:00', '2024-01-22 11:45:00'),
(35, 33, 'virtual_account', 'toss', NULL, NULL, NULL, NULL, '신한은행', '987-654-321000', false, true, '2024-03-10 16:15:00', '2024-03-10 16:15:00'),
(36, 34, 'card', 'toss', '****-****-****-2345', 'samsung', '2026-09', '박민수', NULL, NULL, true, true, '2024-02-05 13:30:00', '2024-02-05 13:30:00'),
(37, 34, 'card', 'kakao', '****-****-****-6789', 'hyundai', '2029-01', '박민수', NULL, NULL, false, true, '2024-04-15 12:00:00', '2024-04-15 12:00:00'),
(38, 35, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '우리은행', '555-777-888000', true, true, '2024-01-30 15:45:00', '2024-01-30 15:45:00'),
(39, 35, 'card', 'kakao', '****-****-****-0123', 'lotte', '2027-07', '최지영', NULL, NULL, false, true, '2024-05-20 09:30:00', '2024-05-20 09:30:00'),
(40, 36, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'NH농협', '111-222-333000', true, true, '2024-02-14 17:20:00', '2024-02-14 17:20:00'),
(41, 36, 'card', 'toss', '****-****-****-4567', 'kb', '2028-03', '정수진', NULL, NULL, false, true, '2024-06-10 14:10:00', '2024-06-10 14:10:00'),
(42, 37, 'card', 'kakao', '****-****-****-8901', 'visa', '2026-11', '한민호', NULL, NULL, true, true, '2024-03-05 11:25:00', '2024-03-05 11:25:00'),
(43, 37, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '하나은행', '666-888-999000', false, true, '2024-07-25 13:50:00', '2024-07-25 13:50:00'),
(44, 38, 'card', 'toss', '****-****-****-2345', 'mastercard', '2029-05', '송지은', NULL, NULL, true, true, '2024-03-20 16:40:00', '2024-03-20 16:40:00'),
(45, 38, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'IBK기업은행', '333-555-777000', false, true, '2024-08-12 12:35:00', '2024-08-12 12:35:00'),
(46, 39, 'card', 'kakao', '****-****-****-6789', 'samsung', '2027-02', '김태윤', NULL, NULL, true, true, '2024-04-08 10:20:00', '2024-04-08 10:20:00'),
(47, 39, 'card', 'toss', '****-****-****-0123', 'hyundai', '2028-08', '김태윤', NULL, NULL, false, true, '2024-09-18 15:55:00', '2024-09-18 15:55:00'),
(48, 40, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '우리은행', '777-999-111000', true, true, '2024-04-25 14:15:00', '2024-04-25 14:15:00'),
(49, 40, 'card', 'toss', '****-****-****-4567', 'lotte', '2026-12', '이하늘', NULL, NULL, false, true, '2024-10-05 17:30:00', '2024-10-05 17:30:00'),
(50, 41, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, '신한은행', '444-666-888000', true, true, '2024-05-12 11:05:00', '2024-05-12 11:05:00'),
(51, 41, 'card', 'toss', '****-****-****-8901', 'kb', '2029-04', '박서현', NULL, NULL, false, true, '2024-11-15 13:45:00', '2024-11-15 13:45:00'),
(52, 42, 'card', 'kakao', '****-****-****-2345', 'visa', '2027-10', '최민석', NULL, NULL, true, true, '2024-05-30 16:20:00', '2024-05-30 16:20:00'),
(53, 42, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '국민은행', '888-111-333000', false, true, '2024-12-02 12:50:00', '2024-12-02 12:50:00'),
(54, 43, 'card', 'toss', '****-****-****-6789', 'mastercard', '2028-06', '조예린', NULL, NULL, true, true, '2024-06-18 14:35:00', '2024-06-18 14:35:00'),
(55, 43, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'NH농협', '222-444-666000', false, true, '2024-12-20 10:40:00', '2024-12-20 10:40:00'),
(56, 44, 'card', 'kakao', '****-****-****-0123', 'samsung', '2026-05', '김영수', NULL, NULL, true, true, '2024-07-03 15:25:00', '2024-07-03 15:25:00'),
(57, 44, 'card', 'toss', '****-****-****-4567', 'hyundai', '2029-07', '김영수', NULL, NULL, false, true, '2025-01-10 11:15:00', '2025-01-10 11:15:00'),
(58, 45, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '하나은행', '555-777-999000', true, true, '2024-07-20 13:00:00', '2024-07-20 13:00:00'),
(59, 45, 'card', 'toss', '****-****-****-8901', 'lotte', '2027-01', '이수연', NULL, NULL, false, true, '2025-02-05 16:45:00', '2025-02-05 16:45:00'),
(60, 46, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'IBK기업은행', '999-111-222000', true, true, '2024-08-08 12:30:00', '2024-08-08 12:30:00'),
(61, 46, 'card', 'toss', '****-****-****-2345', 'kb', '2028-11', '박동현', NULL, NULL, false, true, '2025-03-12 14:55:00', '2025-03-12 14:55:00'),
(62, 47, 'card', 'kakao', '****-****-****-6789', 'visa', '2026-08', '김나연', NULL, NULL, true, true, '2024-08-25 10:10:00', '2024-08-25 10:10:00'),
(63, 47, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '국민은행', '333-555-777000', false, true, '2025-04-18 13:25:00', '2025-04-18 13:25:00'),
(64, 48, 'card', 'toss', '****-****-****-0123', 'mastercard', '2029-02', '정현우', NULL, NULL, true, true, '2024-09-12 16:50:00', '2024-09-12 16:50:00'),
(65, 48, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, '신한은행', '666-888-999000', false, true, '2025-05-25 12:15:00', '2025-05-25 12:15:00'),
(66, 49, 'card', 'kakao', '****-****-****-4567', 'samsung', '2027-09', '한지민', NULL, NULL, true, true, '2024-09-30 14:40:00', '2024-09-30 14:40:00'),
(67, 49, 'card', 'toss', '****-****-****-8901', 'hyundai', '2028-01', '한지민', NULL, NULL, false, true, '2025-06-08 11:30:00', '2025-06-08 11:30:00'),
(68, 50, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '우리은행', '777-999-111000', true, true, '2024-10-15 15:20:00', '2024-10-15 15:20:00'),
(69, 50, 'card', 'toss', '****-****-****-2345', 'lotte', '2026-06', '송민수', NULL, NULL, false, true, '2025-07-20 17:45:00', '2025-07-20 17:45:00'),
(70, 51, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'NH농협', '444-666-888000', true, true, '2024-11-02 13:35:00', '2024-11-02 13:35:00'),
(71, 51, 'card', 'toss', '****-****-****-6789', 'kb', '2029-08', '이진우', NULL, NULL, false, true, '2025-08-15 16:00:00', '2025-08-15 16:00:00'),
(72, 52, 'card', 'kakao', '****-****-****-0123', 'visa', '2027-03', '박지영', NULL, NULL, true, true, '2024-11-20 12:25:00', '2024-11-20 12:25:00'),
(73, 52, 'bank_transfer', 'toss', NULL, NULL, NULL, NULL, '하나은행', '888-111-333000', false, true, '2025-09-10 14:50:00', '2025-09-10 14:50:00'),
(74, 53, 'card', 'toss', '****-****-****-4567', 'mastercard', '2028-12', '최수빈', NULL, NULL, true, true, '2024-12-08 11:15:00', '2024-12-08 11:15:00'),
(75, 53, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, 'IBK기업은행', '222-444-666000', false, true, '2025-10-25 15:40:00', '2025-10-25 15:40:00'),
(76, 54, 'card', 'kakao', '****-****-****-8901', 'samsung', '2026-07', '김서진', NULL, NULL, true, true, '2024-12-25 13:10:00', '2024-12-25 13:10:00'),
(77, 54, 'card', 'toss', '****-****-****-2345', 'hyundai', '2029-09', '김서진', NULL, NULL, false, true, '2025-11-12 16:25:00', '2025-11-12 16:25:00'),
(78, 55, 'bank_transfer', 'kakao', NULL, NULL, NULL, NULL, '우리은행', '555-777-999000', true, true, '2025-01-05 14:05:00', '2025-01-05 14:05:00'),
(79, 55, 'card', 'toss', '****-****-****-6789', 'lotte', '2027-05', '정도현', NULL, NULL, false, true, '2025-12-20 12:50:00', '2025-12-20 12:50:00'),
(80, 56, 'virtual_account', 'kakao', NULL, NULL, NULL, NULL, '신한은행', '999-111-222000', true, true, '2025-01-22 17:30:00', '2025-01-22 17:30:00'),
(81, 56, 'card', 'toss', '****-****-****-0123', 'kb', '2028-04', '이미래', NULL, NULL, false, true, '2025-01-30 10:45:00', '2025-01-30 10:45:00');

-- ==============================================
-- 데이터 요약 정보
-- ==============================================

-- 결제 통계:
-- - 총 결제 건수: 60건
-- - 상담 결제: 40건 (66.7%)
-- - 크레딧 구매: 20건 (33.3%)
-- - 총 결제 금액: ₩1,685,250 (상담) + ₩1,480,000 (크레딧) = ₩3,165,250

-- 결제 방법별 분포:
-- - 카드 결제: 42건 (70%)
-- - 계좌 이체: 13건 (21.7%)
-- - 가상 계좌: 5건 (8.3%)

-- 결제 제공업체별 분포:
-- - 토스: 30건 (50%)
-- - 카카오페이: 30건 (50%)

-- 결제수단 현황:
-- - 총 등록 결제수단: 81개
-- - 카드: 50개 (61.7%)
-- - 계좌 이체: 16개 (19.8%)
-- - 가상 계좌: 15개 (18.5%)

-- 평균 결제 금액:
-- - 상담 결제: ₩18,281
-- - 크레딧 구매: ₩74,000
-- - 전체 평균: ₩52,754