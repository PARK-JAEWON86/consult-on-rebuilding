-- ==============================================
-- 정산 시스템 강화 데이터 (기존 스키마 활용)
-- ==============================================
-- 기존 30명 전문가 + 25명 고객 데이터를 활용한 완전한 정산 시스템
-- 2024년 1월~9월 실제 상담 활동 데이터 포함

-- 데이터 무결성을 위한 foreign key 체크 비활성화 (임시)
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 기존 사용자 데이터 그대로 사용 (02_users.sql)
-- 관리자 1명, 전문가 30명 (id: 2-31), 클라이언트 25명 (id: 32-56)

-- 2. 기존 전문가 데이터에 정산 관련 필드 보강
-- 상위 10명 전문가의 요금을 정산 시스템에 맞게 조정
UPDATE Expert SET
  ratePerMin = 1500,
  hourlyRate = 90000,
  totalSessions = totalSessions + 50,
  reviewCount = reviewCount + 20
WHERE id = 1; -- 김민수 (심리상담)

UPDATE Expert SET
  ratePerMin = 2500,
  hourlyRate = 150000,
  totalSessions = totalSessions + 35,
  reviewCount = reviewCount + 15
WHERE id = 3; -- 박철수 (법률상담)

UPDATE Expert SET
  ratePerMin = 2000,
  hourlyRate = 120000,
  totalSessions = totalSessions + 42,
  reviewCount = reviewCount + 18
WHERE id = 5; -- 윤태영 (재무상담)

UPDATE Expert SET
  ratePerMin = 1800,
  hourlyRate = 108000,
  totalSessions = totalSessions + 38,
  reviewCount = reviewCount + 16
WHERE id = 2; -- 이영희 (심리상담)

UPDATE Expert SET
  ratePerMin = 2200,
  hourlyRate = 132000,
  totalSessions = totalSessions + 28,
  reviewCount = reviewCount + 12
WHERE id = 4; -- 최은정 (법률상담)

-- 3. 2024년 실제 상담 예약 데이터 생성 (완료된 예약만)
INSERT INTO Reservation (id, displayId, userId, expertId, startAt, endAt, status, cost, createdAt, updatedAt)
VALUES
-- 김민수 심리상담사 (expertId: 1, 1500원/분)
(3001, 'RES_2024_KM_001', 32, 1, '2024-01-15 14:00:00', '2024-01-15 15:00:00', 'CONFIRMED', 90000, '2024-01-15 10:00:00', '2024-01-15 16:00:00'),
(3002, 'RES_2024_KM_002', 33, 1, '2024-01-22 16:00:00', '2024-01-22 17:30:00', 'CONFIRMED', 135000, '2024-01-22 12:00:00', '2024-01-22 18:00:00'),
(3003, 'RES_2024_KM_003', 34, 1, '2024-02-05 10:00:00', '2024-02-05 11:00:00', 'CONFIRMED', 90000, '2024-02-05 08:00:00', '2024-02-05 12:00:00'),
(3004, 'RES_2024_KM_004', 35, 1, '2024-02-18 15:00:00', '2024-02-18 16:30:00', 'CONFIRMED', 135000, '2024-02-18 11:00:00', '2024-02-18 17:00:00'),
(3005, 'RES_2024_KM_005', 36, 1, '2024-03-10 14:00:00', '2024-03-10 15:00:00', 'CONFIRMED', 90000, '2024-03-10 10:00:00', '2024-03-10 16:00:00'),
(3006, 'RES_2024_KM_006', 37, 1, '2024-03-25 11:00:00', '2024-03-25 12:30:00', 'CONFIRMED', 135000, '2024-03-25 09:00:00', '2024-03-25 13:00:00'),
(3007, 'RES_2024_KM_007', 38, 1, '2024-04-08 16:00:00', '2024-04-08 17:00:00', 'CONFIRMED', 90000, '2024-04-08 14:00:00', '2024-04-08 18:00:00'),
(3008, 'RES_2024_KM_008', 39, 1, '2024-04-22 13:00:00', '2024-04-22 14:30:00', 'CONFIRMED', 135000, '2024-04-22 11:00:00', '2024-04-22 15:00:00'),
(3009, 'RES_2024_KM_009', 40, 1, '2024-05-12 15:00:00', '2024-05-12 16:00:00', 'CONFIRMED', 90000, '2024-05-12 13:00:00', '2024-05-12 17:00:00'),
(3010, 'RES_2024_KM_010', 41, 1, '2024-06-03 14:00:00', '2024-06-03 15:30:00', 'CONFIRMED', 135000, '2024-06-03 12:00:00', '2024-06-03 16:00:00'),
(3011, 'RES_2024_KM_011', 42, 1, '2024-07-15 16:00:00', '2024-07-15 17:00:00', 'CONFIRMED', 90000, '2024-07-15 14:00:00', '2024-07-15 18:00:00'),
(3012, 'RES_2024_KM_012', 43, 1, '2024-08-20 10:00:00', '2024-08-20 11:30:00', 'CONFIRMED', 135000, '2024-08-20 08:00:00', '2024-08-20 12:00:00'),

-- 박철수 변호사 (expertId: 3, 2500원/분)
(3013, 'RES_2024_PC_001', 32, 3, '2024-01-12 10:00:00', '2024-01-12 12:00:00', 'CONFIRMED', 300000, '2024-01-12 08:00:00', '2024-01-12 13:00:00'),
(3014, 'RES_2024_PC_002', 33, 3, '2024-01-28 14:00:00', '2024-01-28 15:00:00', 'CONFIRMED', 150000, '2024-01-28 12:00:00', '2024-01-28 16:00:00'),
(3015, 'RES_2024_PC_003', 34, 3, '2024-02-15 09:00:00', '2024-02-15 11:00:00', 'CONFIRMED', 300000, '2024-02-15 07:00:00', '2024-02-15 12:00:00'),
(3016, 'RES_2024_PC_004', 36, 3, '2024-03-05 16:00:00', '2024-03-05 17:30:00', 'CONFIRMED', 225000, '2024-03-05 14:00:00', '2024-03-05 18:00:00'),
(3017, 'RES_2024_PC_005', 35, 3, '2024-03-22 11:00:00', '2024-03-22 12:00:00', 'CONFIRMED', 150000, '2024-03-22 09:00:00', '2024-03-22 13:00:00'),
(3018, 'RES_2024_PC_006', 37, 3, '2024-04-18 14:00:00', '2024-04-18 16:00:00', 'CONFIRMED', 300000, '2024-04-18 12:00:00', '2024-04-18 17:00:00'),
(3019, 'RES_2024_PC_007', 38, 3, '2024-05-25 10:00:00', '2024-05-25 11:30:00', 'CONFIRMED', 225000, '2024-05-25 08:00:00', '2024-05-25 12:00:00'),
(3020, 'RES_2024_PC_008', 39, 3, '2024-06-20 15:00:00', '2024-06-20 17:00:00', 'CONFIRMED', 300000, '2024-06-20 13:00:00', '2024-06-20 18:00:00'),

-- 윤태영 재무설계사 (expertId: 5, 2000원/분)
(3021, 'RES_2024_YT_001', 33, 5, '2024-01-10 15:00:00', '2024-01-10 16:30:00', 'CONFIRMED', 180000, '2024-01-10 13:00:00', '2024-01-10 17:00:00'),
(3022, 'RES_2024_YT_002', 34, 5, '2024-02-08 10:00:00', '2024-02-08 12:00:00', 'CONFIRMED', 240000, '2024-02-08 08:00:00', '2024-02-08 13:00:00'),
(3023, 'RES_2024_YT_003', 35, 5, '2024-02-25 14:00:00', '2024-02-25 15:00:00', 'CONFIRMED', 120000, '2024-02-25 12:00:00', '2024-02-25 16:00:00'),
(3024, 'RES_2024_YT_004', 36, 5, '2024-03-15 11:00:00', '2024-03-15 13:00:00', 'CONFIRMED', 240000, '2024-03-15 09:00:00', '2024-03-15 14:00:00'),
(3025, 'RES_2024_YT_005', 37, 5, '2024-04-12 16:00:00', '2024-04-12 17:30:00', 'CONFIRMED', 180000, '2024-04-12 14:00:00', '2024-04-12 18:00:00'),
(3026, 'RES_2024_YT_006', 38, 5, '2024-05-20 09:00:00', '2024-05-20 11:00:00', 'CONFIRMED', 240000, '2024-05-20 07:00:00', '2024-05-20 12:00:00'),
(3027, 'RES_2024_YT_007', 40, 5, '2024-06-18 14:00:00', '2024-06-18 15:30:00', 'CONFIRMED', 180000, '2024-06-18 12:00:00', '2024-06-18 16:00:00'),
(3028, 'RES_2024_YT_008', 41, 5, '2024-07-22 11:00:00', '2024-07-22 13:00:00', 'CONFIRMED', 240000, '2024-07-22 09:00:00', '2024-07-22 14:00:00'),

-- 이영희 상담심리사 (expertId: 2, 1800원/분)
(3029, 'RES_2024_LY_001', 42, 2, '2024-01-18 16:00:00', '2024-01-18 17:00:00', 'CONFIRMED', 108000, '2024-01-18 14:00:00', '2024-01-18 18:00:00'),
(3030, 'RES_2024_LY_002', 43, 2, '2024-02-12 10:00:00', '2024-02-12 11:30:00', 'CONFIRMED', 162000, '2024-02-12 08:00:00', '2024-02-12 12:00:00'),
(3031, 'RES_2024_LY_003', 44, 2, '2024-03-08 15:00:00', '2024-03-08 16:00:00', 'CONFIRMED', 108000, '2024-03-08 13:00:00', '2024-03-08 17:00:00'),
(3032, 'RES_2024_LY_004', 45, 2, '2024-04-05 14:00:00', '2024-04-05 15:30:00', 'CONFIRMED', 162000, '2024-04-05 12:00:00', '2024-04-05 16:00:00'),
(3033, 'RES_2024_LY_005', 46, 2, '2024-05-15 11:00:00', '2024-05-15 12:00:00', 'CONFIRMED', 108000, '2024-05-15 09:00:00', '2024-05-15 13:00:00'),
(3034, 'RES_2024_LY_006', 47, 2, '2024-06-10 16:00:00', '2024-06-10 17:30:00', 'CONFIRMED', 162000, '2024-06-10 14:00:00', '2024-06-10 18:00:00'),

-- 최은정 변호사 (expertId: 4, 2200원/분)
(3035, 'RES_2024_CE_001', 48, 4, '2024-01-25 11:00:00', '2024-01-25 12:00:00', 'CONFIRMED', 132000, '2024-01-25 09:00:00', '2024-01-25 13:00:00'),
(3036, 'RES_2024_CE_002', 49, 4, '2024-02-20 14:00:00', '2024-02-20 15:30:00', 'CONFIRMED', 198000, '2024-02-20 12:00:00', '2024-02-20 16:00:00'),
(3037, 'RES_2024_CE_003', 50, 4, '2024-03-18 10:00:00', '2024-03-18 12:00:00', 'CONFIRMED', 264000, '2024-03-18 08:00:00', '2024-03-18 13:00:00'),
(3038, 'RES_2024_CE_004', 51, 4, '2024-04-28 15:00:00', '2024-04-28 16:00:00', 'CONFIRMED', 132000, '2024-04-28 13:00:00', '2024-04-28 17:00:00'),
(3039, 'RES_2024_CE_005', 52, 4, '2024-05-30 13:00:00', '2024-05-30 14:30:00', 'CONFIRMED', 198000, '2024-05-30 11:00:00', '2024-05-30 15:00:00'),

-- IT상담 전문가 (expertId: 6, 2700원/분)
(3040, 'RES_2024_IT_001', 53, 6, '2024-01-20 14:00:00', '2024-01-20 16:00:00', 'CONFIRMED', 324000, '2024-01-20 12:00:00', '2024-01-20 17:00:00'),
(3041, 'RES_2024_IT_002', 54, 6, '2024-02-28 10:00:00', '2024-02-28 11:30:00', 'CONFIRMED', 243000, '2024-02-28 08:00:00', '2024-02-28 12:00:00'),
(3042, 'RES_2024_IT_003', 55, 6, '2024-03-30 15:00:00', '2024-03-30 17:00:00', 'CONFIRMED', 324000, '2024-03-30 13:00:00', '2024-03-30 18:00:00'),
(3043, 'RES_2024_IT_004', 56, 6, '2024-04-25 11:00:00', '2024-04-25 12:30:00', 'CONFIRMED', 243000, '2024-04-25 09:00:00', '2024-04-25 13:00:00'),

-- 추가 전문가들의 소규모 상담 (expertId: 7-12)
(3044, 'RES_2024_EX7_001', 32, 7, '2024-03-12 14:00:00', '2024-03-12 15:30:00', 'CONFIRMED', 171000, '2024-03-12 12:00:00', '2024-03-12 16:00:00'),
(3045, 'RES_2024_EX8_001', 33, 8, '2024-04-08 16:00:00', '2024-04-08 17:00:00', 'CONFIRMED', 151200, '2024-04-08 14:00:00', '2024-04-08 18:00:00'),
(3046, 'RES_2024_EX9_001', 34, 9, '2024-05-05 10:00:00', '2024-05-05 11:30:00', 'CONFIRMED', 172800, '2024-05-05 08:00:00', '2024-05-05 12:00:00'),
(3047, 'RES_2024_EX10_001', 35, 10, '2024-06-12 15:00:00', '2024-06-12 16:00:00', 'CONFIRMED', 108000, '2024-06-12 13:00:00', '2024-06-12 17:00:00'),
(3048, 'RES_2024_EX11_001', 36, 11, '2024-07-18 11:00:00', '2024-07-18 12:30:00', 'CONFIRMED', 189000, '2024-07-18 09:00:00', '2024-07-18 13:00:00'),
(3049, 'RES_2024_EX12_001', 37, 12, '2024-08-22 14:00:00', '2024-08-22 16:00:00', 'CONFIRMED', 288000, '2024-08-22 12:00:00', '2024-08-22 17:00:00')

ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  cost = VALUES(cost),
  updatedAt = NOW();

-- 4. 크레딧 거래 내역 (정확한 정산 계산 12% 수수료)
INSERT INTO CreditTransaction (userId, amount, reason, refId, createdAt)
VALUES
-- 고객들의 크레딧 사용 (상담 예약 시)
(32, -90000, 'consultation:payment', 'RES_2024_KM_001', '2024-01-15 10:00:00'),
(33, -135000, 'consultation:payment', 'RES_2024_KM_002', '2024-01-22 12:00:00'),
(34, -90000, 'consultation:payment', 'RES_2024_KM_003', '2024-02-05 08:00:00'),
(35, -135000, 'consultation:payment', 'RES_2024_KM_004', '2024-02-18 11:00:00'),
(36, -90000, 'consultation:payment', 'RES_2024_KM_005', '2024-03-10 10:00:00'),
(37, -135000, 'consultation:payment', 'RES_2024_KM_006', '2024-03-25 09:00:00'),
(38, -90000, 'consultation:payment', 'RES_2024_KM_007', '2024-04-08 14:00:00'),
(39, -135000, 'consultation:payment', 'RES_2024_KM_008', '2024-04-22 11:00:00'),
(40, -90000, 'consultation:payment', 'RES_2024_KM_009', '2024-05-12 13:00:00'),
(41, -135000, 'consultation:payment', 'RES_2024_KM_010', '2024-06-03 12:00:00'),
(42, -90000, 'consultation:payment', 'RES_2024_KM_011', '2024-07-15 14:00:00'),
(43, -135000, 'consultation:payment', 'RES_2024_KM_012', '2024-08-20 08:00:00'),

(32, -300000, 'consultation:payment', 'RES_2024_PC_001', '2024-01-12 08:00:00'),
(33, -150000, 'consultation:payment', 'RES_2024_PC_002', '2024-01-28 12:00:00'),
(34, -300000, 'consultation:payment', 'RES_2024_PC_003', '2024-02-15 07:00:00'),
(36, -225000, 'consultation:payment', 'RES_2024_PC_004', '2024-03-05 14:00:00'),
(35, -150000, 'consultation:payment', 'RES_2024_PC_005', '2024-03-22 09:00:00'),
(37, -300000, 'consultation:payment', 'RES_2024_PC_006', '2024-04-18 12:00:00'),
(38, -225000, 'consultation:payment', 'RES_2024_PC_007', '2024-05-25 08:00:00'),
(39, -300000, 'consultation:payment', 'RES_2024_PC_008', '2024-06-20 13:00:00'),

(33, -180000, 'consultation:payment', 'RES_2024_YT_001', '2024-01-10 13:00:00'),
(34, -240000, 'consultation:payment', 'RES_2024_YT_002', '2024-02-08 08:00:00'),
(35, -120000, 'consultation:payment', 'RES_2024_YT_003', '2024-02-25 12:00:00'),
(36, -240000, 'consultation:payment', 'RES_2024_YT_004', '2024-03-15 09:00:00'),
(37, -180000, 'consultation:payment', 'RES_2024_YT_005', '2024-04-12 14:00:00'),
(38, -240000, 'consultation:payment', 'RES_2024_YT_006', '2024-05-20 07:00:00'),
(40, -180000, 'consultation:payment', 'RES_2024_YT_007', '2024-06-18 12:00:00'),
(41, -240000, 'consultation:payment', 'RES_2024_YT_008', '2024-07-22 09:00:00'),

-- 전문가들의 크레딧 수익 (상담 완료 후, 12% 수수료 차감 = cost * 0.88)
-- 김민수 (userId: 2, expertId: 1)
(2, 79200, 'consultation:completed', 'RES_2024_KM_001', '2024-01-15 16:00:00'),   -- 90000 * 0.88
(2, 118800, 'consultation:completed', 'RES_2024_KM_002', '2024-01-22 18:00:00'),  -- 135000 * 0.88
(2, 79200, 'consultation:completed', 'RES_2024_KM_003', '2024-02-05 12:00:00'),
(2, 118800, 'consultation:completed', 'RES_2024_KM_004', '2024-02-18 17:00:00'),
(2, 79200, 'consultation:completed', 'RES_2024_KM_005', '2024-03-10 16:00:00'),
(2, 118800, 'consultation:completed', 'RES_2024_KM_006', '2024-03-25 13:00:00'),
(2, 79200, 'consultation:completed', 'RES_2024_KM_007', '2024-04-08 18:00:00'),
(2, 118800, 'consultation:completed', 'RES_2024_KM_008', '2024-04-22 15:00:00'),
(2, 79200, 'consultation:completed', 'RES_2024_KM_009', '2024-05-12 17:00:00'),
(2, 118800, 'consultation:completed', 'RES_2024_KM_010', '2024-06-03 16:00:00'),
(2, 79200, 'consultation:completed', 'RES_2024_KM_011', '2024-07-15 18:00:00'),
(2, 118800, 'consultation:completed', 'RES_2024_KM_012', '2024-08-20 12:00:00'),

-- 박철수 (userId: 4, expertId: 3)
(4, 264000, 'consultation:completed', 'RES_2024_PC_001', '2024-01-12 13:00:00'),  -- 300000 * 0.88
(4, 132000, 'consultation:completed', 'RES_2024_PC_002', '2024-01-28 16:00:00'),  -- 150000 * 0.88
(4, 264000, 'consultation:completed', 'RES_2024_PC_003', '2024-02-15 12:00:00'),
(4, 198000, 'consultation:completed', 'RES_2024_PC_004', '2024-03-05 18:00:00'),  -- 225000 * 0.88
(4, 132000, 'consultation:completed', 'RES_2024_PC_005', '2024-03-22 13:00:00'),
(4, 264000, 'consultation:completed', 'RES_2024_PC_006', '2024-04-18 17:00:00'),
(4, 198000, 'consultation:completed', 'RES_2024_PC_007', '2024-05-25 12:00:00'),
(4, 264000, 'consultation:completed', 'RES_2024_PC_008', '2024-06-20 18:00:00'),

-- 윤태영 (userId: 6, expertId: 5)
(6, 158400, 'consultation:completed', 'RES_2024_YT_001', '2024-01-10 17:00:00'),  -- 180000 * 0.88
(6, 211200, 'consultation:completed', 'RES_2024_YT_002', '2024-02-08 13:00:00'),  -- 240000 * 0.88
(6, 105600, 'consultation:completed', 'RES_2024_YT_003', '2024-02-25 16:00:00'),  -- 120000 * 0.88
(6, 211200, 'consultation:completed', 'RES_2024_YT_004', '2024-03-15 14:00:00'),
(6, 158400, 'consultation:completed', 'RES_2024_YT_005', '2024-04-12 18:00:00'),
(6, 211200, 'consultation:completed', 'RES_2024_YT_006', '2024-05-20 12:00:00'),
(6, 158400, 'consultation:completed', 'RES_2024_YT_007', '2024-06-18 16:00:00'),
(6, 211200, 'consultation:completed', 'RES_2024_YT_008', '2024-07-22 14:00:00'),

-- 이영희 (userId: 3, expertId: 2)
(3, 95040, 'consultation:completed', 'RES_2024_LY_001', '2024-01-18 18:00:00'),   -- 108000 * 0.88
(3, 142560, 'consultation:completed', 'RES_2024_LY_002', '2024-02-12 12:00:00'),  -- 162000 * 0.88
(3, 95040, 'consultation:completed', 'RES_2024_LY_003', '2024-03-08 17:00:00'),
(3, 142560, 'consultation:completed', 'RES_2024_LY_004', '2024-04-05 16:00:00'),
(3, 95040, 'consultation:completed', 'RES_2024_LY_005', '2024-05-15 13:00:00'),
(3, 142560, 'consultation:completed', 'RES_2024_LY_006', '2024-06-10 18:00:00'),

-- 최은정 (userId: 5, expertId: 4)
(5, 116160, 'consultation:completed', 'RES_2024_CE_001', '2024-01-25 13:00:00'),  -- 132000 * 0.88
(5, 174240, 'consultation:completed', 'RES_2024_CE_002', '2024-02-20 16:00:00'),  -- 198000 * 0.88
(5, 232320, 'consultation:completed', 'RES_2024_CE_003', '2024-03-18 13:00:00'),  -- 264000 * 0.88
(5, 116160, 'consultation:completed', 'RES_2024_CE_004', '2024-04-28 17:00:00'),
(5, 174240, 'consultation:completed', 'RES_2024_CE_005', '2024-05-30 15:00:00'),

-- 기타 전문가들 수익
(7, 150480, 'consultation:completed', 'RES_2024_EX7_001', '2024-03-12 16:00:00'),  -- 171000 * 0.88
(8, 133056, 'consultation:completed', 'RES_2024_EX8_001', '2024-04-08 18:00:00'),  -- 151200 * 0.88
(9, 152064, 'consultation:completed', 'RES_2024_EX9_001', '2024-05-05 12:00:00'),   -- 172800 * 0.88
(10, 95040, 'consultation:completed', 'RES_2024_EX10_001', '2024-06-12 17:00:00'), -- 108000 * 0.88
(11, 166320, 'consultation:completed', 'RES_2024_EX11_001', '2024-07-18 13:00:00'), -- 189000 * 0.88
(12, 253440, 'consultation:completed', 'RES_2024_EX12_001', '2024-08-22 17:00:00')  -- 288000 * 0.88

ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  createdAt = VALUES(createdAt);

-- 5. 리뷰 데이터 추가
INSERT INTO Review (id, displayId, userId, expertId, reservationId, rating, content, isPublic, createdAt, updatedAt)
VALUES
(201, 'REV_KM_001_2024', 32, 1, 3001, 5, '김민수 선생님의 상담이 정말 도움이 되었습니다. 마음이 편해졌어요.', true, '2024-01-15 19:00:00', '2024-01-15 19:00:00'),
(202, 'REV_KM_002_2024', 33, 1, 3002, 4, '전문적이고 친절한 상담이었습니다.', true, '2024-01-22 20:00:00', '2024-01-22 20:00:00'),
(203, 'REV_PC_001_2024', 32, 3, 3013, 5, '박철수 변호사님의 법률 자문이 명확하고 정확했습니다.', true, '2024-01-12 16:00:00', '2024-01-12 16:00:00'),
(204, 'REV_YT_001_2024', 33, 5, 3021, 4, '윤태영 선생님의 재무 상담이 유익했습니다.', true, '2024-01-10 19:00:00', '2024-01-10 19:00:00'),
(205, 'REV_LY_001_2024', 42, 2, 3029, 5, '이영희 선생님의 상담이 정말 따뜻하고 도움이 되었습니다.', true, '2024-01-18 20:00:00', '2024-01-18 20:00:00'),
(206, 'REV_CE_001_2024', 48, 4, 3035, 4, '최은정 변호사님의 개인법무 상담이 정확했습니다.', true, '2024-01-25 16:00:00', '2024-01-25 16:00:00')
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating),
  content = VALUES(content),
  updatedAt = NOW();

-- 6. 세션 기록 데이터
INSERT INTO Session (id, displayId, reservationId, status, startedAt, endedAt, duration, notes, createdAt, updatedAt)
VALUES
(201, 'SES_KM_001_2024', 3001, 'ENDED', '2024-01-15 14:00:00', '2024-01-15 15:00:00', 60, '스트레스 관리 상담 완료', '2024-01-15 14:00:00', '2024-01-15 15:00:00'),
(202, 'SES_KM_002_2024', 3002, 'ENDED', '2024-01-22 16:00:00', '2024-01-22 17:30:00', 90, '심화 상담 진행', '2024-01-22 16:00:00', '2024-01-22 17:30:00'),
(203, 'SES_PC_001_2024', 3013, 'ENDED', '2024-01-12 10:00:00', '2024-01-12 12:00:00', 120, '계약서 검토 및 법률 자문', '2024-01-12 10:00:00', '2024-01-12 12:00:00'),
(204, 'SES_YT_001_2024', 3021, 'ENDED', '2024-01-10 15:00:00', '2024-01-10 16:30:00', 90, '개인 재무 분석 및 투자 상담', '2024-01-10 15:00:00', '2024-01-10 16:30:00')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  duration = VALUES(duration),
  updatedAt = NOW();

-- 7. 전문가 통계 업데이트
UPDATE Expert SET
  reviewCount = (SELECT COUNT(*) FROM Review WHERE expertId = Expert.id),
  ratingAvg = (SELECT ROUND(AVG(rating), 1) FROM Review WHERE expertId = Expert.id WHERE Review.expertId = Expert.id),
  totalSessions = (SELECT COUNT(*) FROM Reservation WHERE expertId = Expert.id AND status = 'CONFIRMED'),
  updatedAt = NOW()
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);

-- foreign key 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 8. 데이터 검증 쿼리
SELECT '=== 강화된 정산 시스템 데이터 검증 ===' as title;

-- 전문가별 총 수익 계산 검증 (상위 6명)
SELECT
  e.name as expert_name,
  e.id as expert_id,
  COUNT(r.id) as total_reservations,
  SUM(r.cost) as total_revenue_gross,
  SUM(ct.amount) as total_credits_earned,
  ROUND(SUM(r.cost) * 0.12) as platform_fee,
  ROUND(SUM(r.cost) * 0.88) as expected_net_revenue,
  CASE
    WHEN SUM(ct.amount) = ROUND(SUM(r.cost) * 0.88) THEN '✅ 일치'
    ELSE '❌ 불일치'
  END as revenue_consistency
FROM Expert e
LEFT JOIN Reservation r ON r.expertId = e.id AND r.status = 'CONFIRMED'
LEFT JOIN CreditTransaction ct ON ct.userId = (e.id + 1) AND ct.reason = 'consultation:completed'
WHERE e.id IN (1, 2, 3, 4, 5, 6)
GROUP BY e.id, e.name
ORDER BY total_revenue_gross DESC;

-- 월별 정산 현황 (2024년)
SELECT
  '월별 정산 현황 (2024년)' as info,
  MONTH(r.endAt) as month,
  COUNT(*) as completed_consultations,
  SUM(r.cost) as total_gross_revenue,
  ROUND(SUM(r.cost) * 0.12) as total_platform_fee,
  ROUND(SUM(r.cost) * 0.88) as total_expert_revenue
FROM Reservation r
WHERE r.status = 'CONFIRMED' AND YEAR(r.endAt) = 2024
GROUP BY MONTH(r.endAt)
ORDER BY month;

-- 전문가별 월 평균 수익 (상위 6명)
SELECT
  e.name as expert_name,
  COUNT(DISTINCT DATE_FORMAT(r.endAt, '%Y-%m')) as active_months,
  ROUND(AVG(monthly_revenue.revenue)) as avg_monthly_revenue,
  MAX(monthly_revenue.revenue) as max_monthly_revenue,
  MIN(monthly_revenue.revenue) as min_monthly_revenue
FROM Expert e
LEFT JOIN (
  SELECT
    expertId,
    DATE_FORMAT(endAt, '%Y-%m') as month,
    SUM(cost) as revenue
  FROM Reservation
  WHERE status = 'CONFIRMED' AND YEAR(endAt) = 2024
  GROUP BY expertId, DATE_FORMAT(endAt, '%Y-%m')
) monthly_revenue ON monthly_revenue.expertId = e.id
WHERE e.id IN (1, 2, 3, 4, 5, 6)
GROUP BY e.id, e.name
ORDER BY avg_monthly_revenue DESC;

SELECT '기존 30명 전문가 데이터를 활용한 완전한 정산 시스템이 구축되었습니다!' as final_message;