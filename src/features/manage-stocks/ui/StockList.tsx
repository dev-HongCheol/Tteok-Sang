"use client"

/**
 * 종목 마스터 목록을 관리하는 테이블 컴포넌트입니다.
 * 종목 검색, 필터링, 승인 처리 및 데이터 동기화 기능을 제공합니다.
 */
import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, CheckCircle2, AlertCircle, Plus, Edit2, Check, RefreshCcw, HelpCircle } from "lucide-react"

import { getStocks, verifyStock } from "@/entities/insight/api/stock"
import { supabase } from "@/shared/api/supabase/client"
import type { Stock } from "@/entities/insight/model/types"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { toast } from "sonner"
import { StockDialog } from "./StockDialog"

/**
 * 종목 마스터 관리 목록 컴포넌트
 */
export function StockList() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filter, setFilter] = React.useState<"all" | "verified" | "unverified">("all")
  
  // Dialog 상태 관리
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState<Stock | null>(null)

  // 1. 데이터 페칭 (전체 종목 목록)
  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
  })

  // 2. 즉시 승인 뮤테이션 (목록에서 바로 승인 버튼 클릭 시)
  const verifyMutation = useMutation({
    mutationFn: (ticker: string) => verifyStock(ticker, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      toast.success("종목이 승인되었습니다.")
    },
    onError: (error: any) => {
      toast.error(`승인 실패: ${error.message}`)
    }
  })

  // 3. 전체 카운트 새로고침 뮤테이션 (실시간 분석 결과와 DB 카운트 동기화)
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_all_stock_counts')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      toast.success("모든 종목의 언급 횟수가 동기화되었습니다.")
    },
    onError: (error: any) => {
      toast.error(`동기화 실패: ${error.message}`)
    }
  })

  // 4. 필터링 로직 (검색어 및 승인 여부)
  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = 
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name_ko.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = 
      filter === "all" || 
      (filter === "verified" && stock.is_verified) || 
      (filter === "unverified" && !stock.is_verified)
    
    return matchesSearch && matchesFilter
  })

  /** 종목 수정 핸들러 */
  const handleEdit = (stock: Stock) => {
    setSelectedStock(stock)
    setDialogOpen(true)
  }

  /** 종목 추가 핸들러 */
  const handleAdd = () => {
    setSelectedStock(null)
    setDialogOpen(true)
  }

  // 로딩 상태 렌더링
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-muted/50 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 툴바: 검색 및 필터, 작업 버튼 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="티커, 종목명, 별칭 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-3">
                <p className="text-xs leading-relaxed">
                  검증된 기업 데이터에 **별칭**으로 추가하면 잘못된 기업명들이 해당 기업으로 업데이트됩니다.
                  <br /><br />
                  <span className="text-primary font-bold">ex)</span> '구글' 별칭에 '구으글' 추가 시, 기존 '구으글' 기업 데이터가 모두 '구글'로 자동 병합됨.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            전체
          </Button>
          <Button
            variant={filter === "unverified" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("unverified")}
            className="flex gap-2"
          >
            미검증
            {stocks.filter(s => !s.is_verified).length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 min-w-5 justify-center">
                {stocks.filter(s => !s.is_verified).length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "verified" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("verified")}
          >
            검증완료
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-2"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCcw className={`size-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">카운트 동기화</span>
          </Button>

          <Button size="sm" className="flex gap-2" onClick={handleAdd}>
            <Plus className="size-4" />
            종목 추가
          </Button>
        </div>
      </div>

      {/* 종목 목록 테이블 */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead>티커</TableHead>
              <TableHead>표준 한글명</TableHead>
              <TableHead>시장</TableHead>
              <TableHead className="hidden md:table-cell">별칭(Aliases)</TableHead>
              <TableHead className="text-right">언급 횟수</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <TableRow key={stock.ticker}>
                  <TableCell>
                    {stock.is_verified ? (
                      <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                        <CheckCircle2 className="size-3.5" />
                        <span>검증됨</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
                        <AlertCircle className="size-3.5" />
                        <span>미검증</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-bold">{stock.ticker}</TableCell>
                  <TableCell className="font-medium">{stock.name_ko}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{stock.market_type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {stock.aliases.map((alias) => (
                        <span key={alias} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {alias}
                        </span>
                      ))}
                      {stock.aliases.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{stock.mention_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(stock)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      {!stock.is_verified && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 flex gap-1 items-center border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => verifyMutation.mutate(stock.ticker)}
                          disabled={verifyMutation.isPending}
                        >
                          <Check className="size-3.5" />
                          승인
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 등록/수정 다이얼로그 */}
      <StockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stock={selectedStock}
      />
    </div>
  )
}
