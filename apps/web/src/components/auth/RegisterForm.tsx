"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { z } from "zod";

// 비밀번호 강도 검사 함수
const passwordSchema = z.string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .max(100, '비밀번호는 100자 이하여야 합니다')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다');

const registerSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글, 영문, 공백만 입력 가능합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = useState({
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });
  const [step, setStep] = useState<'info' | 'verification'>('info');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const { isRegisterLoading } = useAuth();

  // 비밀번호 강도 체크 함수
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 비밀번호 필드인 경우 강도 체크
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // 입력 시 에러 제거
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          newErrors[error.path[0] as keyof FormErrors] = error.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 회원가입 성공 - 인증 코드 입력 단계로 전환
        setStep('verification');
      } else {
        if (data.error?.code === 'CONFLICT') {
          setErrors({
            email: '이미 사용 중인 이메일입니다.'
          });
        } else {
          setErrors({
            general: data.error?.message || "회원가입에 실패했습니다."
          });
        }
      }
    } catch (err: any) {
      setErrors({
        general: err.message || "회원가입에 실패했습니다."
      });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setVerificationError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${verificationCode}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.success) {
        // 인증 성공 - 회원가입 완료! 로그인 페이지로 이동
        alert('이메일 인증이 완료되었습니다! 로그인해주세요.');
        router.push('/auth/login');
      } else {
        setVerificationError(data.error?.message || '유효하지 않은 인증 코드입니다.');
      }
    } catch (error) {
      setVerificationError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setVerificationError('');
        alert('인증 코드를 다시 발송했습니다.');
      } else {
        alert('재전송에 실패했습니다.');
      }
    } catch (error) {
      alert('재전송 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      // Google OAuth는 회원가입과 로그인이 동일
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    } catch (err: any) {
      setErrors({
        general: err.message || "Google 회원가입에 실패했습니다."
      });
    }
  };

  const handleKakaoRegister = async () => {
    try {
      // Kakao OAuth는 회원가입과 로그인이 동일
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/kakao`;
    } catch (err: any) {
      setErrors({
        general: err.message || "Kakao 회원가입에 실패했습니다."
      });
    }
  };

  // 인증 코드 입력 UI
  if (step === 'verification') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            이메일 인증
          </h2>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{formData.email}</span>로
            <br />
            6자리 인증 코드를 발송했습니다.
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-6">
          {verificationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">
                {verificationError}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              인증 코드
            </label>
            <input
              id="code"
              name="code"
              type="text"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono text-2xl"
              placeholder="000000"
              disabled={isVerifying}
              autoComplete="off"
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              이메일에서 받은 6자리 숫자를 입력하세요
            </p>
          </div>

          <button
            type="submit"
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                인증 중...
              </div>
            ) : (
              '인증하기'
            )}
          </button>

          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              인증 코드를 받지 못하셨나요? 다시 보내기
            </button>
            <div>
              <button
                type="button"
                onClick={() => setStep('info')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← 이전으로 돌아가기
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">
              {errors.general}
            </div>
          </div>
        )}

        {/* 이름 입력 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            이름
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="이름을 입력하세요"
              disabled={isRegisterLoading}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* 이메일 입력 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            이메일 주소
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="your@email.com"
              disabled={isRegisterLoading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            비밀번호
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="비밀번호를 입력하세요 (최소 8자)"
              disabled={isRegisterLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isRegisterLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          {/* 비밀번호 강도 표시 */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">비밀번호 강도:</p>
              <div className="space-y-1">
                <div className={`flex items-center text-xs ${
                  passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className="mr-1">{passwordStrength.hasMinLength ? '✓' : '○'}</span>
                  최소 8자 이상
                </div>
                <div className={`flex items-center text-xs ${
                  passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className="mr-1">{passwordStrength.hasLowerCase ? '✓' : '○'}</span>
                  소문자 포함
                </div>
                <div className={`flex items-center text-xs ${
                  passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className="mr-1">{passwordStrength.hasUpperCase ? '✓' : '○'}</span>
                  대문자 포함
                </div>
                <div className={`flex items-center text-xs ${
                  passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className="mr-1">{passwordStrength.hasNumber ? '✓' : '○'}</span>
                  숫자 포함
                </div>
                <div className={`flex items-center text-xs ${
                  passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className="mr-1">{passwordStrength.hasSpecialChar ? '✓' : '○'}</span>
                  특수문자 포함 (@$!%*?&)
                </div>
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* 비밀번호 확인 입력 */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            비밀번호 확인
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isRegisterLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isRegisterLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          {/* 비밀번호 일치 확인 표시 */}
          {formData.confirmPassword && (
            <div className="mt-1">
              <div className={`flex items-center text-xs ${
                formData.password === formData.confirmPassword
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}>
                <span className="mr-1">
                  {formData.password === formData.confirmPassword ? '✓' : '✗'}
                </span>
                {formData.password === formData.confirmPassword
                  ? '비밀번호가 일치합니다'
                  : '비밀번호가 일치하지 않습니다'}
              </div>
            </div>
          )}

          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* 회원가입 버튼 */}
        <div>
          <button
            type="submit"
            disabled={isRegisterLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isRegisterLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isRegisterLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                회원가입 중...
              </div>
            ) : (
              "회원가입"
            )}
          </button>
        </div>

        {/* 로그인 링크 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인하기
            </Link>
          </p>
        </div>
      </form>

      {/* 구분선 */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 소셜 회원가입 버튼들 */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isRegisterLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            {isRegisterLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Google 회원가입 중...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 회원가입
              </>
            )}
          </button>

          {/* 카카오 회원가입 버튼 */}
          <button
            type="button"
            onClick={handleKakaoRegister}
            disabled={isRegisterLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-yellow-400 rounded-md shadow-sm bg-yellow-400 text-sm font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.2 4.52 6.66l-.93 3.44c-.05.18.15.32.29.21l4.05-2.68c.69.09 1.4.13 2.07.13 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z" />
            </svg>
            KakaoTalk으로 회원가입
          </button>

          {/* 네이버 회원가입 버튼 */}
          <button
            type="button"
            onClick={() => console.log('Naver signup')}
            disabled={isRegisterLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-green-500 rounded-md shadow-sm bg-green-500 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
            </svg>
            Naver로 회원가입
          </button>
        </div>

        {/* 개인정보 동의 안내 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          소셜 회원가입을 통해 계속하시면{" "}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            이용약관
          </a>{" "}
          및{" "}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;