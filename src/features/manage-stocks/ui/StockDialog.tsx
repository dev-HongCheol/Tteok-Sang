"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { addStock, updateStock } from "@/entities/insight/api/stock"
import type { Stock } from "@/entities/insight/model/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Switch } from "@/shared/ui/switch"

interface StockDialogProps {
  stock?: Stock | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockDialog({ stock, open, onOpenChange }: StockDialogProps) {
  const queryClient = useQueryClient()
  const isEdit = !!stock

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<Partial<Stock>>({
    values: stock ? {
      ticker: stock.ticker,
      name_ko: stock.name_ko,
      market_type: stock.market_type,
      aliases: stock.aliases,
      is_verified: stock.is_verified,
    } : {
      ticker: "",
      name_ko: "",
      market_type: "US",
      aliases: [],
      is_verified: false,
    }
  })

  // 1. 저장 뮤테이션
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Stock>) => {
      if (isEdit && stock) {
        return updateStock(stock.ticker, data)
      }
      return addStock(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] })
      toast.success(isEdit ? "종목 정보가 수정되었습니다." : "새로운 종목이 등록되었습니다.")
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast.error(`작업 실패: ${error.message}`)
    }
  })

  const onSubmit = (data: Partial<Stock>) => {
    // Aliases 처리
    if (typeof data.aliases === 'string') {
      data.aliases = (data.aliases as string).split(',').map(s => s.trim()).filter(Boolean)
    }
    saveMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "종목 정보 수정" : "새 종목 등록"}</DialogTitle>
            <DialogDescription>
              {isEdit 
                ? "종목 정보를 수정하고 승인 상태를 관리합니다." 
                : "마스터 데이터에 새로운 종목을 추가합니다."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* 승인 상태 토글 (수정 모드에서만 강조 혹은 항상 표시) */}
            <div className="flex items-center justify-between space-x-2 p-3 rounded-lg bg-muted/50 border">
              <div className="space-y-0.5">
                <Label htmlFor="is_verified" className="text-base">공식 종목 승인</Label>
                <p className="text-xs text-muted-foreground">
                  승인 시 서비스 메인 화면(맵, 랭킹)에 노출됩니다.
                </p>
              </div>
              <Controller
                name="is_verified"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_verified"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ticker">티커 (Ticker)</Label>
              <Input
                id="ticker"
                placeholder="예: NVDA, SpaceX"
                {...register("ticker", { required: "티커를 입력해주세요." })}
              />
              {errors.ticker && <p className="text-xs text-destructive">{errors.ticker.message}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name_ko">표준 한글명</Label>
              <Input
                id="name_ko"
                placeholder="예: 엔비디아, 삼성전자"
                {...register("name_ko", { required: "한글명을 입력해주세요." })}
              />
              {errors.name_ko && <p className="text-xs text-destructive">{errors.name_ko.message}</p>}
            </div>

            <div className="grid gap-3">
              <Label>시장 분류</Label>
              <Controller
                name="market_type"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="KR" id="KR" />
                      <Label htmlFor="KR" className="font-normal cursor-pointer">한국 (KR)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="US" id="US" />
                      <Label htmlFor="US" className="font-normal cursor-pointer">미국 (US)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Global" id="Global" />
                      <Label htmlFor="Global" className="font-normal cursor-pointer">글로벌</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aliases">별칭 (쉼표로 구분)</Label>
              <Input
                id="aliases"
                placeholder="예: Nvidia, NVDIA, 엔비디아 "
                {...register("aliases")}
              />
              <p className="text-[10px] text-muted-foreground">
                AI가 오타를 내더라도 이 목록에 있으면 자동으로 표준 데이터로 매칭됩니다.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "저장 중..." : "저장하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
