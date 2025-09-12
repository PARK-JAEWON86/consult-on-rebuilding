// 이메일 인증 관련 유틸리티 함수들

export interface EmailVerificationData {
  email: string;
  code: string;
  expiresAt: string;
}

// 로컬 스토리지에서 이메일 인증 데이터 관리
export const EmailVerificationStorage = {
  // 인증 코드 저장
  saveVerificationData: (data: EmailVerificationData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('email_verification', JSON.stringify(data));
    }
  },

  // 인증 데이터 조회
  getVerificationData: (): EmailVerificationData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem('email_verification');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // 인증 데이터 삭제
  clearVerificationData: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('email_verification');
    }
  },

  // 인증 코드 유효성 검사
  isCodeValid: (inputCode: string): boolean => {
    const data = EmailVerificationStorage.getVerificationData();
    if (!data) return false;
    
    const now = new Date().getTime();
    const expiresAt = new Date(data.expiresAt).getTime();
    
    return data.code === inputCode && now < expiresAt;
  },

  // 인증 완료 여부 확인
  isVerified: (): boolean => {
    const data = EmailVerificationStorage.getVerificationData();
    if (!data) return false;
    
    const now = new Date().getTime();
    const expiresAt = new Date(data.expiresAt).getTime();
    
    return now < expiresAt;
  }
};
