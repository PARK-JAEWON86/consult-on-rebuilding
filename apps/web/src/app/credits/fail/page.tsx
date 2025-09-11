import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function FailPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <Card className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          결제에 실패했습니다
        </h1>
        
        <p className="text-gray-600 mb-8">
          결제 처리 중 문제가 발생했습니다.<br />
          다시 시도해주세요.
        </p>

        <div className="space-y-3">
          <Link href="/credits">
            <Button className="w-full">
              다시 시도하기
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" className="w-full">
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            계속해서 문제가 발생하면 고객센터로 문의해주세요.
          </p>
        </div>
      </Card>
    </main>
  );
}
