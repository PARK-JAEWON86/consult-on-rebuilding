"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { login, googleLogin, kakaoLogin, isLoginLoading } = useAuth();

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
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors({});

    try {
      await login({
        email: formData.email,
        password: formData.password
      });

      // 로그인 성공 후 리다이렉트
      const redirectUrl = searchParams.get('redirect') || "/";
      router.push(redirectUrl as any);
    } catch (err: any) {
      // 이메일 미인증 에러 처리
      const errorCode = err.error?.code || err.code;

      if (errorCode === 'E_EMAIL_NOT_VERIFIED') {
        setErrors({
          general: err.message || '회원가입 인증 절차를 완료해주세요 (회원가입 탭)'
        });
      } else {
        setErrors({
          general: err.message || "로그인에 실패했습니다."
        });
      }
    }
  };

  const handleGoogleLogin = () => {
    try {
      googleLogin();
    } catch (err: any) {
      setErrors({
        general: err.message || "Google 로그인에 실패했습니다."
      });
    }
  };

  const handleKakaoLogin = () => {
    try {
      kakaoLogin();
    } catch (err: any) {
      setErrors({
        general: err.message || "Kakao 로그인에 실패했습니다."
      });
    }
  };

  // URL 파라미터에서 OAuth 에러 확인
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'oauth-failed': '소셜 로그인에 실패했습니다. 다시 시도해주세요.',
        'google-login-failed': 'Google 계정 연동 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'kakao-login-failed': 'Kakao 계정 연동 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'oauth-refresh-failed': '소셜 로그인 후 인증 처리 중 오류가 발생했습니다.',
      };

      if (errorMessages[errorParam]) {
        setErrors({ general: errorMessages[errorParam] });
        // URL에서 에러 파라미터 제거
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('error');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [searchParams]);

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
              disabled={isLoginLoading}
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
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoginLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoginLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* 로그인 유지 & 비밀번호 찾기 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoginLoading}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              로그인 상태 유지
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <div>
          <button
            type="submit"
            disabled={isLoginLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isLoginLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isLoginLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              "로그인"
            )}
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            아직 계정이 없으신가요?{" "}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입하기
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

        {/* 소셜 로그인 버튼들 */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoginLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            {isLoginLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Google 로그인 중...
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
                Google로 로그인
              </>
            )}
          </button>

          {/* 카카오 로그인 버튼 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={isLoginLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-yellow-400 rounded-md shadow-sm bg-yellow-400 text-sm font-medium text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.2 4.52 6.66l-.93 3.44c-.05.18.15.32.29.21l4.05-2.68c.69.09 1.4.13 2.07.13 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z" />
            </svg>
            KakaoTalk으로 로그인
          </button>

          {/* 네이버 로그인 버튼 */}
          <button
            type="button"
            onClick={() => console.log('Naver login')}
            disabled={isLoginLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-green-500 rounded-md shadow-sm bg-green-500 text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
            </svg>
            Naver로 로그인
          </button>
        </div>

        {/* 개인정보 동의 안내 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          소셜 로그인을 통해 계속하시면{" "}
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

export default LoginForm;
