import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function SuccessPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Card className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          결제가 완료되었습니다
        </h1>
        
        <p className="text-gray-600 mb-8">
          크레딧이 충전되었습니다.<br />
          이제 전문가와 상담을 시작해보세요!
        </p>

        <div className="space-y-3">
          <Link href="/credits">
            <Button className="w-full">
              크레딧 확인하기
            </Button>
          </Link>
          
          <Link href="/experts">
            <Button variant="ghost" className="w-full">
              전문가 찾기
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
