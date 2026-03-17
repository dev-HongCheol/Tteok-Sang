/**
 * 관리자 - 종목 마스터 관리 페이지 모듈입니다.
 */
import { TrendingUp } from "lucide-react"
import { StockList } from "@/features/manage-stocks/ui/StockList"

/** 종목 마스터 관리 페이지 메타데이터 설정 */
export const metadata = {
  title: '종목 마스터 관리 - 떡상 어드민',
  description: 'AI 분석을 위한 표준 종목 데이터 및 별칭 관리',
};

/**
 * 종목 마스터 관리 페이지 컴포넌트입니다.
 * @returns {JSX.Element} 종목 관리 뷰
 */
export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">종목 마스터 관리</h1>
      </div>
      <p className="text-muted-foreground">
        AI 분석에 사용되는 표준 티커와 한글명, 별칭(Aliases)을 관리하고 미검증 종목을 승인합니다.
      </p>
      
      <div className="mt-8">
        <StockList />
      </div>
    </div>
  );
}
