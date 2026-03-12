/**
 * 센티먼트 레이더 위젯 단독 테스트용 라우트입니다.
 */
import { SentimentRadar } from '@/widgets/sentiment-radar/ui/SentimentRadar';

export default function SentimentTestPage() {
  return (
    <div className='min-h-screen bg-background text-foreground p-8'>
      <div className='container mx-auto max-w-5xl'>
        <h1 className='text-2xl font-bold mb-8'>위젯 단독 확인 페이지</h1>
        
        {/* 센티먼트 레이더 위젯 단독 렌더링 */}
        <SentimentRadar />
        
      </div>
    </div>
  );
}
