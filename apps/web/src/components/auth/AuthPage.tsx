"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Card from "@/components/ui/Card";
import { z } from "zod";

// 비밀번호 강도 검사 (간소화)
const passwordSchema = z.string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .regex(/^(?=.*[a-z])(?=.*\d)/, '영문 소문자와 숫자를 포함해야 합니다');

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

const registerSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이하여야 합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

interface AuthPageProps {
  defaultTab?: 'login' | 'register';
}

const AuthPage = ({ defaultTab = 'login' }: AuthPageProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // 회원가입 인증 단계 관련 state
  const [registerStep, setRegisterStep] = useState<'info' | 'verification'>('info');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { login, googleLogin, isLoginLoading, isRegisterLoading } = useAuth();

  // 비밀번호 강도 계산 (간소화)
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[\d@$!%*?&]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-yellow-500';
    if (strength < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return '약함';
    if (strength < 50) return '보통';
    if (strength < 75) return '좋음';
    return '강함';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 입력 시 에러 제거
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const schema = activeTab === 'login' ? loginSchema : registerSchema;
    const dataToValidate = activeTab === 'login'
      ? { email: formData.email, password: formData.password }
      : formData;

    const result = schema.safeParse(dataToValidate);

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
      if (activeTab === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        });

        const redirectUrl = searchParams.get('redirect') || "/";
        router.push(redirectUrl);
      } else {
        // 회원가입 API 직접 호출
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error?.code === 'CONFLICT') {
            setErrors({ email: '이미 사용 중인 이메일입니다.' });
          } else {
            setErrors({ general: data.error?.message || '회원가입에 실패했습니다.' });
          }
          return;
        }

        if (data.success) {
          // 회원가입 성공 - 인증 코드 입력 단계로 전환
          setRegisterStep('verification');
        }
      }
    } catch (err: unknown) {
      const error = err as any;
      if (activeTab === 'register' && error.response?.data?.error?.code === 'CONFLICT') {
        setErrors({
          email: '이미 사용 중인 이메일입니다.'
        });
      } else {
        setErrors({
          general: error.message || `${activeTab === 'login' ? '로그인' : '회원가입'}에 실패했습니다.`
        });
      }
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setErrors({ general: '6자리 인증 코드를 입력해주세요.' });
      return;
    }

    setIsVerifying(true);
    setErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${verificationCode}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (data.success) {
        // 인증 성공 - 로그인 탭으로 전환
        alert('이메일 인증이 완료되었습니다! 로그인해주세요.');
        setActiveTab('login');
        setRegisterStep('info');
        setVerificationCode('');
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: '',
          name: '',
          rememberMe: false,
        });
      } else {
        setErrors({ general: data.error?.message || '유효하지 않은 인증 코드입니다.' });
      }
    } catch (error) {
      setErrors({ general: '인증 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setErrors({});
        alert('인증 코드를 다시 발송했습니다.');
      } else {
        alert('재전송에 실패했습니다.');
      }
    } catch (error) {
      alert('재전송 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      googleLogin();
    } catch (err: unknown) {
      const error = err as any;
      setErrors({
        general: error.message || "Google 인증에 실패했습니다."
      });
    }
  };

  const isLoading = activeTab === 'login' ? isLoginLoading : isRegisterLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Consult-On
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            전문가와의 상담을 시작해보세요
          </p>
        </div>

        <Card className="relative">
          {/* 탭 네비게이션 */}
          <div className="flex mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'login'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ml-2 ${
                activeTab === 'register'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 회원가입 - 인증 단계 */}
          {activeTab === 'register' && registerStep === 'verification' ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  이메일 인증
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {formData.email}로
                </p>
                <p className="text-sm text-gray-600">
                  인증 코드를 전송했습니다.
                </p>
              </div>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600">
                    {errors.general}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  인증 코드 (6자리)
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center tracking-widest font-mono text-2xl"
                  placeholder="000000"
                  disabled={isVerifying}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  isVerifying || verificationCode.length !== 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-[1.02]"
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    인증 중...
                  </div>
                ) : (
                  '인증 완료'
                )}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  인증 코드 재전송
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('info');
                      setVerificationCode('');
                      setErrors({});
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← 이전으로
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 에러 메시지 표시 */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600">
                    {errors.general}
                  </div>
                </div>
              )}

              {/* 회원가입 시에만 이름 필드 */}
              {activeTab === 'register' && (
                <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="이름을 입력하세요"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  autoComplete={activeTab === 'login' ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder={activeTab === 'login' ? "비밀번호를 입력하세요" : "비밀번호를 입력하세요 (최소 8자)"}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* 회원가입 시 비밀번호 강도 바 */}
              {activeTab === 'register' && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">비밀번호 강도</span>
                    <span className="text-xs text-gray-600">
                      {getPasswordStrengthText(getPasswordStrength(formData.password))}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(getPasswordStrength(formData.password))}`}
                      style={{ width: `${getPasswordStrength(formData.password)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    영문 소문자, 숫자 포함 8자 이상
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 회원가입 시에만 비밀번호 확인 필드 */}
            {activeTab === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.confirmPassword ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>

                {/* 비밀번호 일치 확인 */}
                {formData.confirmPassword && (
                  <div className="mt-1">
                    <div className={`flex items-center text-sm ${
                      formData.password === formData.confirmPassword
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}>
                      {formData.password === formData.confirmPassword ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <span className="w-4 h-4 mr-1 text-center">✗</span>
                      )}
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
            )}

            {/* 로그인 시에만 로그인 유지 */}
            {activeTab === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    로그인 상태 유지
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    비밀번호를 잊으셨나요?
                  </a>
                </div>
              </div>
            )}

            {/* 주요 액션 버튼 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-[1.02]"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {activeTab === 'login' ? '로그인 중...' : '회원가입 중...'}
                  </div>
                ) : (
                  activeTab === 'login' ? '로그인' : '회원가입'
                )}
              </button>
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 소셜 로그인 버튼들 (2개로 축소) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                Google
              </button>

              <button
                type="button"
                onClick={() => console.log('Kakao auth')}
                disabled={isLoading}
                className="flex justify-center items-center px-4 py-3 border border-yellow-400 rounded-lg shadow-sm bg-yellow-400 text-sm font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.2 4.52 6.66l-.93 3.44c-.05.18.15.32.29.21l4.05-2.68c.69.09 1.4.13 2.07.13 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z" />
                </svg>
                Kakao
              </button>
            </div>

            {/* 이용약관 동의 안내 */}
            <div className="text-xs text-gray-500 text-center">
              계속 진행하시면{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                이용약관
              </Link>{" "}
              및{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                개인정보처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </div>
          </form>
          )}
        </Card>

        {/* 홈으로 돌아가기 */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;