import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 브랜드 정보 */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4 text-blue-400">Consult On</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              전문가와 함께 성장하는 온디맨드 상담 플랫폼
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@consulton.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>1588-0000</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>서울특별시 강남구</span>
              </div>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">서비스</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/experts" className="text-gray-400 hover:text-white transition-colors">
                  전문가 찾기
                </Link>
              </li>
              <li>
                <Link href="/experts/become" className="text-gray-400 hover:text-white transition-colors">
                  전문가 등록
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-white transition-colors">
                  AI 채팅 상담
                </Link>
              </li>
              <li>
                <Link href="/credits" className="text-gray-400 hover:text-white transition-colors">
                  크레딧 충전
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">지원</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
                  고객센터
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* 회사 정보 */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">회사</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors">
                  채용
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-gray-400 hover:text-white transition-colors">
                  파트너십
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 구분선 및 저작권 */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Consult On. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <span>사업자등록번호: 123-45-67890</span>
              <span>통신판매업신고: 2024-서울강남-0000</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}