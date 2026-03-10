/**
 * 개별 인사이트를 카드 형태로 표시하는 위젯 컴포넌트입니다.
 */
'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import type { InsightWithDetails } from '@/entities/insight/api/insight';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/shared/ui/popover';

/** 인사이트 카드 컴포넌트의 Props 인터페이스 */
interface InsightCardProps {
  /** 표시할 인사이트 데이터 (원본 피드 및 전문가 정보 포함) */
  insight: InsightWithDetails;
}

/**
 * 관련성 데이터를 최상단으로 올리고 3계층 헤더 구조를 가진 인사이트 카드 컴포넌트입니다.
 * @param {InsightCardProps} props 컴포넌트 Props
 * @returns {JSX.Element} 인사이트 카드 UI
 */
export function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    summary_line,
    relevance_score,
    importance,
    market_type,
    mentioned_stocks,
    sectors,
    sentiment_direction,
    sentiment_intensity,
    ts_feeds,
  } = insight;
  const { ts_experts, published_at, tweet_id, content: rawContent } = ts_feeds;

  const importanceStyles = {
    High: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
    Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    Low: 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400',
  };

  const marketIcons = {
    KR: '🇰🇷',
    US: '🇺🇸',
    Global: '🌐',
  };

  const sentimentTheme = {
    Bullish: {
      label: '상승(호재)',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    Bearish: {
      label: '하락(악재)',
      icon: TrendingDown,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
    },
    Neutral: {
      label: '중립',
      icon: Minus,
      color: 'text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-100/10',
    },
  };

  const sentiment = sentiment_direction || 'Neutral';
  const SentimentIcon = sentimentTheme[sentiment].icon;
  const sentimentStyles = sentimentTheme[sentiment];

  const handleOpenOriginal = () => {
    window.open(`https://x.com/${ts_experts.twitter_handle}/status/${tweet_id}`, '_blank');
  };

  return (
    <Card className='overflow-hidden transition-all duration-300 hover:shadow-xl bg-card/60 backdrop-blur-sm border-none shadow-md'>
      <CardHeader className='p-4 pb-2 space-y-1'>
        {/* 1열: 관련성 | 중요도 | 감성점수 ... 시간 */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-sm font-bold'>
            {/* 중요도 */}
            {importance && (
              <Badge
                variant='secondary'
                className={cn(
                  'text-sm font-bold px-1.5 py-0.5 border-none',
                  importanceStyles[importance],
                )}
              >
                {importance}
              </Badge>
            )}

            {/* 감성점수 */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity hover:opacity-80',
                    sentimentStyles.bg,
                  )}
                >
                  <SentimentIcon className={cn('w-3 h-3', sentimentStyles.color)} />
                  <span className={cn('text-sm', sentimentStyles.color)}>
                    {sentimentStyles.label} {sentiment_intensity}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-3'>
                <PopoverHeader className='mb-2'>
                  <PopoverTitle className='text-sm font-bold'>투자 의견 강도 안내</PopoverTitle>
                  <PopoverDescription className='text-sm'>
                    AI가 분석한 트윗의 투자 관점과 그 확신의 강도(1~5)입니다.
                  </PopoverDescription>
                </PopoverHeader>
                <div className='space-y-1.5 text-sm'>
                  {[
                    { level: 5, desc: '매우 강함 (결정적 호재/악재)' },
                    { level: 4, desc: '강함 (명확한 방향성)' },
                    { level: 3, desc: '보통 (일반적인 정보)' },
                    { level: 2, desc: '약함 (참고 수준)' },
                    { level: 1, desc: '매우 약함 (미세한 징후)' },
                  ].map((item) => (
                    <div key={item.level} className='flex items-center gap-2'>
                      <span
                        className={cn(
                          'flex items-center justify-center w-4 h-4 rounded-full font-bold',
                          sentiment_intensity === item.level
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted',
                        )}
                      >
                        {item.level}
                      </span>
                      <span
                        className={
                          sentiment_intensity === item.level ? 'font-bold' : 'text-muted-foreground'
                        }
                      >
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* 관련성 */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className='flex items-center gap-1 group hover:opacity-80 transition-opacity'
                  type='button'
                >
                  <span className='text-zinc-400 font-black'>관련성</span>
                  <span className='text-primary text-sm font-black'>{relevance_score}%</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-3'>
                <PopoverHeader className='mb-2'>
                  <PopoverTitle className='text-sm font-bold'>관련성(Relevance) 안내</PopoverTitle>
                  <PopoverDescription className='text-sm'>
                    트윗 내용이 주식 시장 및 경제 데이터와 얼마나 밀접하게 관련되어 있는지를
                    나타냅니다.
                  </PopoverDescription>
                </PopoverHeader>
                <div className='space-y-1.5 text-sm leading-relaxed'>
                  <p>
                    • <span className='font-bold'>80% 이상:</span> 특정 종목이나 섹터에 직접적인
                    영향을 주는 핵심 정보
                  </p>
                  <p>
                    • <span className='font-bold'>50%~79%:</span> 거시 경제 흐름이나 간접적인 영향을
                    주는 정보
                  </p>
                  <p>
                    • <span className='font-bold'>50% 미만:</span> 연관성이 낮거나 단순 뉴스 공유
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
            {formatDistanceToNow(new Date(published_at), { addSuffix: true, locale: ko })}
          </span>
        </div>

        {/* 2열: 시장분류 | 섹터 */}
        <div className='flex items-center gap-2'>
          {market_type && (
            <div title={market_type} className='w-6 h-4 flex items-center justify-center text-sm'>
              {marketIcons[market_type]}
            </div>
          )}

          <div className='flex flex-wrap gap-1.5'>
            {sectors?.slice(0, 3).map((s) => (
              <span key={s} className='text-sm font-medium text-muted-foreground/80 cursor-default'>
                #{s}
              </span>
            ))}
          </div>
        </div>

        {/* 3열: 스톡 한글명 */}
        {mentioned_stocks && mentioned_stocks.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {mentioned_stocks.map((stock) => (
              <Badge
                key={`${insight.id}-${stock.name_ko}`}
                variant='default'
                className='text-sm font-bold px-2 py-0.5 bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors'
              >
                {stock.name_ko}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className='p-4 pt-1'>
        {/* 전문가 정보 */}
        <div className='flex items-center gap-1 mb-1'>
          <p className='text-sm font-bold text-zinc-400'>
            {ts_experts.name}{' '}
            <span className='font-medium opacity-50 ml-0.5'>@{ts_experts.twitter_handle}</span>
          </p>
        </div>

        {/* 핵심 요약 */}
        <div className='mb-2'>
          {summary_line ? (
            <p className='text-sm leading-snug font-bold text-foreground/90 tracking-tight'>
              {summary_line}
            </p>
          ) : (
            <p className='text-sm italic text-muted-foreground'>분석 중...</p>
          )}
        </div>

        {/* 원문 내용 */}
        <div className='relative group'>
          <div
            className={cn(
              'p-3 rounded-lg bg-muted/20 leading-relaxed text-muted-foreground text-sm transition-all',
              !isExpanded && 'line-clamp-2',
            )}
          >
            <div className='flex items-center justify-between mb-2'>
              <span className='font-bold text-sm text-muted-foreground/40 uppercase tracking-widest'>
                원본피드
              </span>
              <button
                type='button'
                onClick={handleOpenOriginal}
                className='flex items-center gap-1 text-sm font-bold text-muted-foreground/60 hover:text-primary'
              >
                <span>X 보기</span>
                <ExternalLink className='w-2.5 h-2.5' />
              </button>
            </div>
            {rawContent}
          </div>
          <button
            type='button'
            onClick={() => setIsExpanded(!isExpanded)}
            className='mt-2 flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary'
          >
            {isExpanded ? (
              <>
                <ChevronUp className='w-3 h-3' /> 접기
              </>
            ) : (
              <>
                <ChevronDown className='w-3 h-3' /> 원문 전체보기
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
