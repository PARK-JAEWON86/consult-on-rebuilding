/**
 * 예약 카테고리 매핑 (전문가 카테고리 기반)
 * 데이터베이스 Category 테이블의 id와 매핑
 */
export const RESERVATION_CATEGORIES: { [key: string]: number } = {
  '심리상담': 1,
  '법률상담': 2,
  '재무상담': 3,
  '진로상담': 4,
  '건강상담': 5,
  'IT상담': 6,
  '교육상담': 7,
  '사업상담': 8,
  '디자인상담': 9,
  '언어상담': 10,
  '음악상담': 11,
  '여행상담': 12,
  '미용상담': 13,
  '스포츠상담': 14,
  '원예상담': 15,
  '투자상담': 16,
  '영상상담': 17,
  '쇼핑상담': 18,
  '요리상담': 19,
  '반려동물상담': 20,
  '부동산상담': 21,
  '학습상담': 22,
  '육아상담': 23,
  '학교상담': 24,
  '인간관계상담': 25,
  '기타': 26,
};

/**
 * 날짜를 YYYYMMDD 형식으로 변환
 */
export function formatDateForReservationNumber(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 예약번호 생성
 * @param reservationDate 예약 날짜
 * @param sequenceNumber 해당 날짜의 순차 번호
 * @param category 전문가 카테고리
 * @returns RE-YYYYMMDD-###-# 형식의 예약번호
 */
export function generateReservationNumber(
  reservationDate: Date | string,
  sequenceNumber: number,
  category: string
): string {
  const dateStr = formatDateForReservationNumber(reservationDate);
  const seqStr = String(sequenceNumber).padStart(3, '0');
  const categoryCode = RESERVATION_CATEGORIES[category] || RESERVATION_CATEGORIES['기타'];

  return `RE-${dateStr}-${seqStr}-${categoryCode}`;
}

/**
 * 기존 숫자 ID를 예약번호 형식으로 변환 (임시 데이터용)
 * @param id 기존 숫자 ID
 * @param reservationDate 예약 날짜
 * @param category 전문가 카테고리
 * @returns RE-YYYYMMDD-###-# 형식의 예약번호
 */
export function convertIdToReservationNumber(
  id: number,
  reservationDate: Date | string,
  category: string
): string {
  return generateReservationNumber(reservationDate, id, category);
}
