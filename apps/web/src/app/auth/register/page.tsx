"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import RegisterForm from "@/components/auth/RegisterForm";
import Card from "@/components/ui/Card";

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Will redirect
  }

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

        <Card>
          <RegisterForm />
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
}
