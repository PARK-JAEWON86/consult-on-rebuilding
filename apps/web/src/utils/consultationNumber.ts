/**
 * 상담번호 생성 및 관리 유틸리티
 * 형식: CO-YYYYMMDD-###-#
 * - CO: 컨설트 온의 약자
 * - YYYYMMDD: 상담 날짜
 * - ###: 해당 날짜의 순차 번호 (001, 002, ...)
 * - #: 상담 카테고리 번호 (1: 심리상담, 2: 법률상담, 3: 재무상담, ...)
 */

export interface CategoryMapping {
  [key: string]: number;
}

// 상담 카테고리 매핑
export const CONSULTATION_CATEGORIES: CategoryMapping = {
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
 * 상담번호 생성
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
 * 상담번호에서 정보 추출
 * @param consultationNumber CO-YYYYMMDD-###-# 형식의 상담번호
 * @returns 추출된 정보 객체
 */
export function parseConsultationNumber(consultationNumber: string) {
  const parts = consultationNumber.split('-');

  if (parts.length !== 4 || parts[0] !== 'CO') {
    throw new Error('Invalid consultation number format');
  }

  const [prefix, dateStr, seqStr, categoryCode] = parts;

  // 날짜 파싱
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month - 1, day);

  // 시퀀스 번호
  const sequenceNumber = parseInt(seqStr);

  // 카테고리 찾기
  const categoryCode_num = parseInt(categoryCode);
  const category = Object.entries(CONSULTATION_CATEGORIES).find(
    ([_, code]) => code === categoryCode_num
  )?.[0] || '기타';

  return {
    prefix,
    date,
    sequenceNumber,
    category,
    categoryCode: categoryCode_num,
    raw: consultationNumber
  };
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

/**
 * 상담번호 검증
 * @param consultationNumber 검증할 상담번호
 * @returns 유효한지 여부
 */
export function isValidConsultationNumber(consultationNumber: string): boolean {
  try {
    parseConsultationNumber(consultationNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * 상담번호를 표시용으로 포맷팅 (복사하기 쉽게)
 * @param consultationNumber 상담번호
 * @returns 포맷된 상담번호
 */
export function formatConsultationNumberForDisplay(consultationNumber: string): string {
  if (!isValidConsultationNumber(consultationNumber)) {
    return consultationNumber;
  }

  const parsed = parseConsultationNumber(consultationNumber);
  const dateStr = parsed.date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '').replace(/\s/g, '');

  return `${consultationNumber} (${dateStr} ${parsed.category})`;
}