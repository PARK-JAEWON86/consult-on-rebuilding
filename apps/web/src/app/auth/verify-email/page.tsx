"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendMessage('인증 이메일을 다시 발송했습니다.');
      } else {
        throw new Error('재전송에 실패했습니다.');
      }
    } catch (error) {
      setResendMessage('재전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  };

  // 이메일이 없으면 회원가입 페이지로 리다이렉트
  useEffect(() => {
    if (!email) {
      router.push('/auth/register');
    }
  }, [email, router]);

  if (!email) {
    return null; // 로딩 중이거나 리다이렉트 중
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* 제목 */}
          <h2 className="text-3xl font-extrabold text-gray-900">
            이메일 인증을 확인해주세요
          </h2>

          {/* 설명 */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{email}</span>로
              인증 이메일을 발송했습니다.
            </p>
            <p className="text-sm text-gray-600">
              이메일을 확인하고 인증 코드를 입력해주세요.
            </p>
          </div>

          {/* 이메일 아이콘 */}
          <div className="mt-6 mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">이메일이 도착하지 않았나요?</p>
              <ul className="text-left space-y-1 text-blue-700">
                <li>• 스팸 폴더를 확인해주세요</li>
                <li>• 이메일 주소가 정확한지 확인해주세요</li>
                <li>• 최대 5분 정도 소요될 수 있습니다</li>
              </ul>
            </div>
          </div>

          {/* 재전송 메시지 */}
          {resendMessage && (
            <div className={`mt-4 p-3 rounded-md ${
              resendMessage.includes('발송')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm">{resendMessage}</p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-8 space-y-4">
            {/* 재전송 버튼 */}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  재전송 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  인증 이메일 다시 보내기
                </>
              )}
            </button>

            {/* 로그인 페이지로 이동 */}
            <Link
              href="/auth/login"
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              로그인 페이지로 이동
            </Link>

            {/* 뒤로 가기 */}
            <button
              onClick={() => router.back()}
              className="w-full flex justify-center items-center py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로 가기
            </button>
          </div>

          {/* 추가 도움말 */}
          <div className="mt-8 text-xs text-gray-500">
            <p>
              문제가 지속되면{" "}
              <a href="mailto:support@consult-on.kr" className="text-blue-600 hover:text-blue-500">
                고객센터
              </a>
              로 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}