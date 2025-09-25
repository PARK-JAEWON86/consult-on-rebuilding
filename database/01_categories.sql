-- ==============================================
-- 01. 카테고리 데이터 (Categories)
-- ==============================================
-- 상담 분야별 카테고리 기본 데이터
-- 총 26개 카테고리

-- Category 테이블 데이터 입력 (Prisma 스키마 호환)
-- 총 26개 카테고리
INSERT INTO Category (
    id, slug, nameKo, nameEn, icon, description, `order`, isActive, createdAt, updatedAt
) VALUES
(1, 'psychology', '심리상담', 'Psychology Counseling', 'Brain', '스트레스, 우울, 불안 등 심리 건강 관련 상담', 1, true, NOW(), NOW()),
(2, 'legal', '법률상담', 'Legal Advice', 'Scale', '계약, 분쟁, 상속 등 법률 관련 상담', 2, true, NOW(), NOW()),
(3, 'finance', '재무상담', 'Financial Planning', 'DollarSign', '투자, 자산관리, 세무 등 재무 관련 상담', 3, true, NOW(), NOW()),
(4, 'health', '건강상담', 'Health Consultation', 'Heart', '영양, 운동, 건강관리 등 건강 관련 상담', 4, true, NOW(), NOW()),
(5, 'career', '진로상담', 'Career Guidance', 'Target', '취업, 이직, 진로 탐색 등 진로 관련 상담', 5, true, NOW(), NOW()),
(6, 'it', 'IT상담', 'IT Consultation', 'Code', '프로그래밍, 소프트웨어 개발 등 IT 관련 상담', 6, true, NOW(), NOW()),
(7, 'education', '교육상담', 'Educational Counseling', 'BookOpen', '학습법, 입시, 유학 등 교육 관련 상담', 7, true, NOW(), NOW()),
(8, 'business', '사업상담', 'Business Consulting', 'Briefcase', '창업, 경영, 마케팅 등 사업 관련 상담', 8, true, NOW(), NOW()),
(9, 'design', '디자인상담', 'Design Consultation', 'Palette', 'UI/UX, 그래픽 디자인 등 디자인 관련 상담', 9, true, NOW(), NOW()),
(10, 'language', '언어상담', 'Language Learning', 'Languages', '외국어 학습, 번역 등 언어 관련 상담', 10, true, NOW(), NOW()),
(11, 'music', '음악상담', 'Music Instruction', 'Music', '악기, 작곡, 음악 이론 등 음악 관련 상담', 11, true, NOW(), NOW()),
(12, 'travel', '여행상담', 'Travel Planning', 'Plane', '여행 계획, 관광지 추천 등 여행 관련 상담', 12, true, NOW(), NOW()),
(13, 'beauty', '미용상담', 'Beauty Consultation', 'Scissors', '헤어, 메이크업, 스타일링 등 미용 관련 상담', 13, true, NOW(), NOW()),
(14, 'sports', '스포츠상담', 'Sports Coaching', 'Trophy', '운동법, 경기 전략 등 스포츠 관련 상담', 14, true, NOW(), NOW()),
(15, 'gardening', '원예상담', 'Gardening Advice', 'Sprout', '식물 재배, 정원 가꾸기 등 원예 관련 상담', 15, true, NOW(), NOW()),
(16, 'investment', '투자상담', 'Investment Advisory', 'TrendingUp', '주식, 부동산, 암호화폐 등 투자 관련 상담', 16, true, NOW(), NOW()),
(17, 'video', '영상상담', 'Video Production', 'Video', '영상 제작, 편집, 유튜브 등 영상 관련 상담', 17, true, NOW(), NOW()),
(18, 'shopping', '쇼핑상담', 'Shopping Guide', 'ShoppingBag', '상품 추천, 구매 가이드 등 쇼핑 관련 상담', 18, true, NOW(), NOW()),
(19, 'cooking', '요리상담', 'Culinary Arts', 'ChefHat', '레시피, 요리법, 식품 영양 등 요리 관련 상담', 19, true, NOW(), NOW()),
(20, 'pet-care', '반려동물상담', 'Pet Care', 'PawPrint', '펫케어, 훈련, 건강 등 반려동물 관련 상담', 20, true, NOW(), NOW()),
(21, 'real-estate', '부동산상담', 'Real Estate', 'Building2', '매매, 임대, 투자 등 부동산 관련 상담', 21, true, NOW(), NOW()),
(22, 'study', '학습상담', 'Study Methods', 'GraduationCap', '공부법, 시험 준비, 학습 계획 등 학습 관련 상담', 22, true, NOW(), NOW()),
(23, 'parenting', '육아상담', 'Parenting', 'Baby', '육아법, 아이 교육, 양육 등 육아 관련 상담', 23, true, NOW(), NOW()),
(24, 'school', '학교상담', 'School Counseling', 'School', '입학, 전학, 학교 생활 등 학교 관련 상담', 24, true, NOW(), NOW()),
(25, 'relationships', '인간관계상담', 'Relationship Counseling', 'Users', '대인관계, 소통, 갈등 해결 등 인간관계 관련 상담', 25, true, NOW(), NOW()),
(26, 'others', '기타', 'Others', 'Star', '기타 상담 분야', 26, true, NOW(), NOW());