/**
 * 관리자 - 대시보드 메인 페이지 모듈입니다.
 */
import { History, LayoutDashboard, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

/** 대시보드 페이지 메타데이터 설정 */
export const metadata = {
  title: '어드민 대시보드 - 떡상',
  description: '떡상 시스템 관리자 메인 대시보드',
};

/**
 * 대시보드 페이지 컴포넌트입니다.
 * @returns {JSX.Element} 대시보드 뷰
 */
export default function Page() {
  const stats = [
    {
      title: '전문가 수',
      value: '8',
      description: '현재 수집 중인 전문가',
      icon: Users,
      href: '/admin/experts',
    },
    {
      title: '관리 종목',
      value: '542',
      description: '마스터 데이터 등록 수',
      icon: TrendingUp,
      href: '/admin/stocks',
    },
    {
      title: '최근 동기화',
      value: '성공',
      description: '15분 전 완료',
      icon: History,
      href: '/admin/logs',
    },
  ];

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex items-center gap-2'>
        <LayoutDashboard className='size-6 text-primary' />
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className='hover:bg-accent/50 transition-colors cursor-pointer'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
                <stat.icon className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stat.value}</div>
                <p className='text-xs text-muted-foreground'>{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>시스템 현황</CardTitle>
            <CardDescription>최근 24시간 동안의 파이프라인 작동 상태입니다.</CardDescription>
          </CardHeader>
          <CardContent className='h-[200px] flex items-center justify-center text-muted-foreground border-t'>
            준비 중 (차트 예정)
          </CardContent>
        </Card>
        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>최근 검증 필요 종목</CardTitle>
            <CardDescription>AI가 새로 발견한 종목들입니다.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4 border-t pt-4'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>DeepSeek (DPSK)</span>
              <span className='text-xs text-muted-foreground'>30분 전</span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Groq</span>
              <span className='text-xs text-muted-foreground'>1시간 전</span>
            </div>
            <Link href='/admin/stocks' className='text-xs text-primary hover:underline mt-2'>
              전체 보기 →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
