/**
 * Recharts를 사용하여 섹터별 그룹화와 Finviz 스타일을 적용한 시장 지도 컴포넌트입니다.
 */
'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import type { StockSentimentRanking } from '@/entities/insight/model/types';

interface SentimentMarketMapProps {
  /** 종목 랭킹 데이터 */
  data: StockSentimentRanking[];
  /** 종목 선택 핸들러 */
  onSelect: (val: { ticker: string; name: string }) => void;
}

/**
 * Finviz 스타일의 색상 추출 함수
 */
const getFinvizColor = (score: number) => {
  if (score >= 15) return '#30cc5a';
  if (score >= 5) return '#24a148';
  if (score > 0) return '#1a5a2a';
  if (score <= -15) return '#f63538';
  if (score <= -5) return '#bf2233';
  if (score < 0) return '#731818';
  return '#414141';
};

/**
 * 트리맵 커스텀 컨텐츠 (레이블 렌더러)
 * foreignObject를 사용하여 CSS truncate 적용
 */
const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, score, onSelect, ticker } = props;

  // 텍스트가 표시될 최소 공간 확인
  const isLargeEnough = width > 35 && height > 25;

  return (
    <g onClick={() => onSelect({ ticker, name })} className='group cursor-pointer'>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className='transition-colors duration-200'
        style={{
          fill: getFinvizColor(score),
          stroke: '#000',
          strokeWidth: 1,
        }}
      />
      {/* 호재/악재에 따른 호버 오버레이 효과 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill='white'
        fillOpacity={0}
        className='group-hover:fill-opacity-10 transition-opacity pointer-events-none'
      />

      {isLargeEnough && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className='w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden pointer-events-none select-none'>
            <span
              className='text-white text-center leading-none truncate w-full mb-0.5'
              style={{
                fontSize: `${Math.max(9, Math.min(width / 6, 13))}px`,
                fontWeight: 700,
              }}
            >
              {name}
            </span>
            <span
              className='text-white text-center opacity-90 leading-none'
              style={{
                fontSize: `${Math.max(8, Math.min(width / 8, 10))}px`,
                fontWeight: 500,
              }}
            >
              {score > 0 ? '+' : ''}
              {score}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

/**
 * 커스텀 툴팁 컴포넌트
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className='bg-[#1a1a1a] border border-white/20 p-2 rounded shadow-xl'>
        <div className='flex items-center gap-2 mb-1 border-b border-white/10 pb-1'>
          <span className='text-white font-bold text-sm'>{data.name}</span>
          <span className='text-[10px] text-white/50 uppercase'>{data.ticker}</span>
        </div>
        <div className='flex justify-between items-center gap-4'>
          <span className='text-[10px] text-white/40 uppercase'>Sentiment</span>
          <span
            className='font-mono font-bold text-xs'
            style={{ color: getFinvizColor(data.score) }}
          >
            {data.score > 0 ? '+' : ''}
            {data.score}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function SentimentMarketMap({ data, onSelect }: SentimentMarketMapProps) {
  const chartData = useMemo(() => {
    const sectorsMap = data.reduce(
      (acc, item) => {
        const sector = item.sector || '기타';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push({
          name: item.name_ko,
          ticker: item.ticker,
          value: Math.max(Math.abs(item.total_score), 2),
          score: item.total_score,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return Object.entries(sectorsMap).map(([sectorName, children]) => ({
      name: sectorName,
      children,
    }));
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className='h-full w-full bg-black'>
      <ResponsiveContainer width='100%' height='100%'>
        <Treemap
          data={chartData}
          dataKey='value'
          aspectRatio={4 / 3}
          stroke='#000'
          content={<CustomizedContent onSelect={onSelect} />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
