"use client";

import { useState, useEffect } from "react";
import { Brain, MessageCircle, Target, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AIChatPromoSection() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('consulton-user');
        const storedAuth = localStorage.getItem('consulton-auth');
        
        if (storedUser && storedAuth) {
          const isAuth = JSON.parse(storedAuth);
          setIsAuthenticated(isAuth);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
              <Brain className="h-16 w-16 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            어떤 상담을 해야할지 모르시나요?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            AI가 당신의 상황을 파악하고 가장 적합한 상담 분야를 추천해드립니다.
            <br />
            무료로 간단한 대화를 통해 맞춤형 상담 방향을 찾아보세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <MessageCircle className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                즉시 상담
              </h3>
              <p className="text-blue-100 text-sm">
                24시간 언제든지 AI와 대화하며 상담 방향을 찾아보세요
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Target className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                맞춤 추천
              </h3>
              <p className="text-blue-100 text-sm">
                AI가 분석하여 가장 적합한 전문가와 상담 분야를 추천
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <DollarSign className="h-8 w-8 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                월간 무료
              </h3>
              <p className="text-blue-100 text-sm">
                월 100,000 토큰 무료 제공
              </p>
            </div>
          </div>

          <Link href="/experts">
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              무료 AI 채팅상담 시작하기 →
            </button>
          </Link>
          <p className="text-blue-200 text-sm mt-6">
            평균 3-5분 소요 • 월간 무료 할당량 제공 • 크레딧으로 추가 이용 가능
          </p>
        </div>
      </div>
    </section>
  );
}
