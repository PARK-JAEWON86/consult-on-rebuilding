"use client";

import { LayoutProps } from "@/types/layout";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({
  children,
  showFooter = true,
  className = ""
}: LayoutProps) {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <Navbar />

      <div className="flex min-h-screen">
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col">
          <main className={`flex-1 ${className}`}>
            {children}
          </main>

          {/* 푸터 */}
          {showFooter && <Footer />}
        </div>
      </div>
    </div>
  );
}
