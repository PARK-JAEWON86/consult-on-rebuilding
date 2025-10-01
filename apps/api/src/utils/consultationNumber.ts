/**
 * 상담 카테고리 매핑 (프론트엔드와 일치)
 */
export const CONSULTATION_CATEGORIES: { [key: string]: number } = {
  '심리상담': 1,
  '법률상담': 2,
  '재무상담': 3,
  '건강상담': 4,
  '교육상담': 5,
  '진로상담': 6,
  '기타': 9,
};

/**
 * 날짜를 YYYYMMDD 형식으로 변환
 */
export function formatDateForConsultationNumber(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 상담번호 생성 (프론트엔드와 일치)
 * @param consultationDate 상담 날짜
 * @param sequenceNumber 해당 날짜의 순차 번호
 * @param category 상담 카테고리
 * @returns CO-YYYYMMDD-###-# 형식의 상담번호
 */
export function generateConsultationNumber(
  consultationDate: Date | string,
  sequenceNumber: number,
  category: string
): string {
  const dateStr = formatDateForConsultationNumber(consultationDate);
  const seqStr = String(sequenceNumber).padStart(3, '0');
  const categoryCode = CONSULTATION_CATEGORIES[category] || CONSULTATION_CATEGORIES['기타'];

  return `CO-${dateStr}-${seqStr}-${categoryCode}`;
}

/**
 * 기존 숫자 ID를 바코드 형식으로 변환 (임시 데이터용)
 * @param id 기존 숫자 ID
 * @param consultationDate 상담 날짜
 * @param category 상담 카테고리
 * @returns CO-YYYYMMDD-###-# 형식의 상담번호
 */
export function convertIdToConsultationNumber(
  id: number,
  consultationDate: Date | string,
  category: string
): string {
  return generateConsultationNumber(consultationDate, id, category);
}