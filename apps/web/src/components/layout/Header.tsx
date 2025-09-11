import Link from 'next/link';
import Navbar from './Navbar';

export default function Header() {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          {/* 로고 */}
          <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            Consult On
          </Link>

          {/* 네비게이션 */}
          <Navbar />
        </div>
      </div>
    </header>
  );
}
