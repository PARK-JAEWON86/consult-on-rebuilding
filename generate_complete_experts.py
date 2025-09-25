#!/usr/bin/env python3
"""
30명 전체 전문가의 완벽한 프로필 데이터를 생성하는 스크립트
- 계산된 다양한 레벨 적용
- users 테이블의 expertId와 매핑
- 완전한 expert_profiles INSERT 구문 생성
"""

import random

# 계산된 30명 전문가의 레벨 정보 (앞서 계산한 결과)
expert_levels = {
    2: {"name": "김민지", "level": "미시컬 (Lv.999)", "price": 800, "tier": "Mythical"},
    4: {"name": "박서준", "level": "미시컬 (Lv.989)", "price": 800, "tier": "Mythical"},
    7: {"name": "강태현", "level": "레전드 (Lv.939)", "price": 600, "tier": "Legend"},
    9: {"name": "임지훈", "level": "레전드 (Lv.883)", "price": 600, "tier": "Legend"},
    16: {"name": "정승우", "level": "챔피언 (Lv.818)", "price": 500, "tier": "Champion"},
    21: {"name": "조아름", "level": "챔피언 (Lv.770)", "price": 500, "tier": "Champion"},
    3: {"name": "이준호", "level": "챔피언 (Lv.753)", "price": 500, "tier": "Champion"},
    13: {"name": "이채원", "level": "그랜드마스터 (Lv.737)", "price": 450, "tier": "Grandmaster"},
    6: {"name": "정민수", "level": "그랜드마스터 (Lv.721)", "price": 450, "tier": "Grandmaster"},
    27: {"name": "강서연", "level": "그랜드마스터 (Lv.704)", "price": 450, "tier": "Grandmaster"},
    17: {"name": "강민준", "level": "그랜드마스터 (Lv.689)", "price": 450, "tier": "Grandmaster"},
    12: {"name": "김다은", "level": "그랜드마스터 (Lv.671)", "price": 450, "tier": "Grandmaster"},
    30: {"name": "한준서", "level": "그랜드마스터 (Lv.686)", "price": 450, "tier": "Grandmaster"},
    23: {"name": "이서우", "level": "그랜드마스터 (Lv.675)", "price": 450, "tier": "Grandmaster"},
    20: {"name": "한지윤", "level": "그랜드마스터 (Lv.661)", "price": 450, "tier": "Grandmaster"},
    28: {"name": "윤민재", "level": "그랜드마스터 (Lv.650)", "price": 450, "tier": "Grandmaster"},
    14: {"name": "박준영", "level": "그랜드마스터 (Lv.640)", "price": 450, "tier": "Grandmaster"},
    5: {"name": "최유진", "level": "그랜드마스터 (Lv.629)", "price": 450, "tier": "Grandmaster"},
    25: {"name": "최나연", "level": "그랜드마스터 (Lv.616)", "price": 450, "tier": "Grandmaster"},
    31: {"name": "조예린", "level": "그랜드마스터 (Lv.606)", "price": 450, "tier": "Grandmaster"},
    18: {"name": "윤재현", "level": "그랜드마스터 (Lv.606)", "price": 450, "tier": "Grandmaster"},
    11: {"name": "조현우", "level": "마스터 (Lv.595)", "price": 400, "tier": "Master"},
    22: {"name": "김도현", "level": "마스터 (Lv.585)", "price": 400, "tier": "Master"},
    29: {"name": "임지현", "level": "마스터 (Lv.577)", "price": 400, "tier": "Master"},
    24: {"name": "박시우", "level": "마스터 (Lv.563)", "price": 400, "tier": "Master"},
    15: {"name": "최하은", "level": "마스터 (Lv.560)", "price": 400, "tier": "Master"},
    8: {"name": "윤서연", "level": "마스터 (Lv.554)", "price": 400, "tier": "Master"},
    19: {"name": "임소은", "level": "마스터 (Lv.544)", "price": 400, "tier": "Master"},
    26: {"name": "정우진", "level": "마스터 (Lv.539)", "price": 400, "tier": "Master"},
    10: {"name": "한소영", "level": "마스터 (Lv.528)", "price": 400, "tier": "Master"},
}

# 전문가별 상세 정보
expert_details = {
    2: {"jobTitle": "심리상담 전문가", "specialties": ["심리상담", "인지행동치료", "스트레스 관리"], "categories": ["심리상담", "인간관계상담"]},
    3: {"jobTitle": "법률상담 전문가", "specialties": ["법률상담", "계약서 검토", "분쟁 해결"], "categories": ["법률상담", "사업상담"]},
    4: {"jobTitle": "재무상담 전문가", "specialties": ["재무상담", "투자상담", "자산관리"], "categories": ["재무상담", "투자상담"]},
    5: {"jobTitle": "건강상담 전문가", "specialties": ["건강상담", "영양상담", "운동상담"], "categories": ["건강상담", "요리상담"]},
    6: {"jobTitle": "진로상담 전문가", "specialties": ["진로상담", "취업상담", "이직상담"], "categories": ["진로상담", "교육상담"]},
    7: {"jobTitle": "IT상담 전문가", "specialties": ["IT상담", "프로그래밍", "소프트웨어 개발"], "categories": ["IT상담", "사업상담"]},
    8: {"jobTitle": "디자인상담 전문가", "specialties": ["디자인상담", "UI/UX 디자인", "그래픽 디자인"], "categories": ["디자인상담", "IT상담"]},
    9: {"jobTitle": "사업상담 전문가", "specialties": ["사업상담", "창업상담", "경영상담"], "categories": ["사업상담", "재무상담"]},
    10: {"jobTitle": "언어상담 전문가", "specialties": ["언어상담", "외국어학습", "번역상담"], "categories": ["언어상담", "교육상담"]},
    11: {"jobTitle": "음악상담 전문가", "specialties": ["음악상담", "악기지도", "작곡상담"], "categories": ["음악상담", "교육상담"]},
    12: {"jobTitle": "여행상담 전문가", "specialties": ["여행상담", "여행계획", "관광지추천"], "categories": ["여행상담", "언어상담"]},
    13: {"jobTitle": "미용상담 전문가", "specialties": ["미용상담", "헤어스타일", "메이크업"], "categories": ["미용상담", "스타일링"]},
    14: {"jobTitle": "스포츠상담 전문가", "specialties": ["스포츠상담", "운동법", "체력관리"], "categories": ["스포츠상담", "건강상담"]},
    15: {"jobTitle": "원예상담 전문가", "specialties": ["원예상담", "식물재배", "정원가꾸기"], "categories": ["원예상담", "건강상담"]},
    16: {"jobTitle": "투자상담 전문가", "specialties": ["투자상담", "주식투자", "부동산투자"], "categories": ["투자상담", "재무상담"]},
    17: {"jobTitle": "영상상담 전문가", "specialties": ["영상상담", "영상제작", "편집기법"], "categories": ["영상상담", "IT상담"]},
    18: {"jobTitle": "쇼핑상담 전문가", "specialties": ["쇼핑상담", "상품추천", "구매가이드"], "categories": ["쇼핑상담", "사업상담"]},
    19: {"jobTitle": "요리상담 전문가", "specialties": ["요리상담", "레시피개발", "식품영양"], "categories": ["요리상담", "건강상담"]},
    20: {"jobTitle": "반려동물상담 전문가", "specialties": ["반려동물상담", "펫케어", "훈련지도"], "categories": ["반려동물상담", "건강상담"]},
    21: {"jobTitle": "부동산상담 전문가", "specialties": ["부동산상담", "부동산투자", "매매중개"], "categories": ["부동산상담", "투자상담"]},
    22: {"jobTitle": "학습상담 전문가", "specialties": ["학습상담", "공부법지도", "시험준비"], "categories": ["학습상담", "교육상담"]},
    23: {"jobTitle": "육아상담 전문가", "specialties": ["육아상담", "아이교육", "양육지도"], "categories": ["육아상담", "교육상담"]},
    24: {"jobTitle": "학교상담 전문가", "specialties": ["학교상담", "입학지도", "학교생활"], "categories": ["학교상담", "교육상담"]},
    25: {"jobTitle": "인간관계상담 전문가", "specialties": ["인간관계상담", "소통기술", "갈등해결"], "categories": ["인간관계상담", "심리상담"]},
    26: {"jobTitle": "기타상담 전문가", "specialties": ["기타상담", "다양한분야", "종합상담"], "categories": ["기타"]},
    27: {"jobTitle": "심리상담 전문가", "specialties": ["심리상담", "상담치료", "정신건강"], "categories": ["심리상담", "인간관계상담"]},
    28: {"jobTitle": "법률상담 전문가", "specialties": ["법률상담", "법무자문", "소송지원"], "categories": ["법률상담", "사업상담"]},
    29: {"jobTitle": "재무상담 전문가", "specialties": ["재무상담", "자산관리", "세무자문"], "categories": ["재무상담", "투자상담"]},
    30: {"jobTitle": "건강상담 전문가", "specialties": ["건강상담", "헬스케어", "생활습관"], "categories": ["건강상담", "요리상담"]},
    31: {"jobTitle": "진로상담 전문가", "specialties": ["진로상담", "커리어코칭", "취업지원"], "categories": ["진로상담", "교육상담"]},
}

def generate_expert_profile(expert_id, profile_id):
    """전문가 프로필 데이터 생성"""
    info = expert_levels[expert_id]
    details = expert_details[expert_id]

    # 기본 통계 (다양성을 위해 조정)
    base_sessions = random.randint(120, 500)
    avg_rating = round(random.uniform(4.2, 4.8), 1)
    review_count = random.randint(60, 200)
    repeat_clients = random.randint(10, 60)
    like_count = random.randint(40, 200)

    hourly_rate = info["price"] * 60

    # MBTI 랜덤 생성
    mbti_types = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
                  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"]
    mbti = random.choice(mbti_types)

    return f"""({profile_id}, {expert_id}, '{info["name"]}', '{details["jobTitle"]}',
    '{random.randint(3, 12)}년 경력의 {details["jobTitle"][:-2]} 전문가로, 다양한 분야에서 전문적인 상담을 제공합니다.',
    '{", ".join(details["specialties"][:2])} 등 관련 문제에 대한 전문적인 상담을 제공합니다. 개인의 상황과 목표에 맞는 맞춤형 솔루션을 제시합니다.',
    '["서울대학교 관련학과 학사", "연세대학교 관련학과 석사"]',
    '[{{"name": "관련 자격증 1급", "issuer": "한국관련협회"}}, {{"name": "전문가 자격증", "issuer": "관련기관"}}]',
    '{details["specialties"]}',
    '["전문분야1", "전문분야2", "전문분야3", "전문분야4"]',
    '전문적이고 친근한 상담 스타일로 고객의 목표 달성을 돕습니다.',
    '["일반인", "직장인", "학생", "전문가"]',
    {random.randint(20, 80)}, {repeat_clients}, {random.randint(60, 120)},
    '2025-09-16 {random.randint(9, 18):02d}:00',
    '24시간 전 취소 시 100% 환불',
    '24시간 전까지 일정 변경 가능',
    '공휴일에는 상담을 진행하지 않습니다.',
    '[]',
    '{{"linkedIn": "https://linkedin.com/in/{info["name"].lower()}", "website": "https://{details["jobTitle"][:2]}care.co.kr"}}',
    '[]',
    '{{"phone": "010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}", "email": "expert{expert_id-1}@consult-on.kr", "location": "서울특별시", "website": "https://care.co.kr"}}',
    null, '[]',
    '{details["specialties"]}',
    '["video", "chat"]',
    '["한국어"]',
    {hourly_rate}, {info["price"]}, {base_sessions}, {avg_rating}, {review_count}, {random.randint(85, 95)},
    '{random.randint(30, 120)}분 이내',
    '{info["level"]}',
    {random.randint(100, 1000)},
    '2025-09-20 {random.randint(1, 23):02d}:{random.randint(0, 59):02d}:00',
    '2024-{random.randint(1, 12):02d}-{random.randint(1, 28):02d} 00:00:00',
    '{{"monday": {{"available": true, "hours": "09:00-18:00"}}, "tuesday": {{"available": true, "hours": "09:00-18:00"}}, "wednesday": {{"available": true, "hours": "09:00-18:00"}}, "thursday": {{"available": true, "hours": "09:00-18:00"}}, "friday": {{"available": true, "hours": "09:00-18:00"}}, "saturday": {{"available": false, "hours": ""}}, "sunday": {{"available": false, "hours": ""}}}}',
    '{mbti}', NOW(), NOW())"""

def main():
    print("-- 30명 전체 전문가 프로필 데이터 (다양한 레벨 적용)")
    print("INSERT INTO expert_profiles (")
    print("    id, expertId, fullName, jobTitle, bio, description, education, certifications,")
    print("    specialties, specialtyAreas, consultationStyle, targetAudience, successStories,")
    print("    repeatClients, averageSessionDuration, nextAvailableSlot, cancellationPolicy,")
    print("    reschedulePolicy, holidayPolicy, portfolioItems, socialProof, pricingTiers,")
    print("    contactInfo, profileImage, portfolioFiles, tags, consultationTypes, languages,")
    print("    hourlyRate, pricePerMinute, totalSessions, avgRating, reviewCount, completionRate,")
    print("    responseTime, level, profileViews, lastActiveAt, joinedAt, availability, mbti,")
    print("    createdAt, updatedAt")
    print(") VALUES")

    # 30명 전체 전문가 프로필 생성 (expertId 2-31)
    profiles = []
    profile_id = 1

    for expert_id in range(2, 32):  # 2부터 31까지
        if expert_id in expert_levels:
            profile = generate_expert_profile(expert_id, profile_id)
            profiles.append(profile)
            profile_id += 1

    # SQL 출력
    for i, profile in enumerate(profiles):
        if i == len(profiles) - 1:  # 마지막
            print(profile + ";")
        else:
            print(profile + ",")

    print("\n-- 30명 전체 전문가 프로필 데이터 입력 완료")

    # 티어별 분포 출력
    tier_counts = {}
    for expert_id, info in expert_levels.items():
        tier = info["tier"]
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

    print(f"\n-- 티어 분포:")
    for tier, count in tier_counts.items():
        percentage = (count / len(expert_levels)) * 100
        print(f"-- {tier}: {count}명 ({percentage:.1f}%)")

if __name__ == "__main__":
    main()