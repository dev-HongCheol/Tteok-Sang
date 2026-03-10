-- Tteok-Sang (떡상) Database Schema
-- Last Updated: 2026-03-09

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ts_experts (Expert profile information)
create table if not exists public.ts_experts (
  id uuid primary key default uuid_generate_v4(),
  twitter_handle text unique not null,
  name text not null,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.ts_experts is '인사이트를 제공하는 전문가 프로필 정보';
comment on column public.ts_experts.twitter_handle is '전문가의 트위터(X) 핸들 아이디';
comment on column public.ts_experts.name is '전문가 표시 이름';
comment on column public.ts_experts.last_synced_at is '마지막으로 피드를 동기화한 시점 (증분 수집용)';
comment on column public.ts_experts.created_at is '데이터 생성 일시';

-- 2. ts_feeds (Raw tweets/feeds collected from Nitter)
create table if not exists public.ts_feeds (
  id uuid primary key default uuid_generate_v4(),
  expert_id uuid references public.ts_experts(id) on delete cascade not null,
  tweet_id text unique not null,
  content text not null,
  published_at timestamptz not null,
  raw_data jsonb,
  created_at timestamptz default now()
);

comment on table public.ts_feeds is 'Nitter를 통해 수집된 트윗 원본 데이터';
comment on column public.ts_feeds.expert_id is '해당 피드를 작성한 전문가 ID (ts_experts 외래키)';
comment on column public.ts_feeds.tweet_id is '트위터(X) 고유 트윗 ID';
comment on column public.ts_feeds.content is '트윗 본문 내용';
comment on column public.ts_feeds.published_at is '트윗이 실제 작성된 시점';
comment on column public.ts_feeds.raw_data is '수집 시점의 RSS 원본 데이터 전체 (JSON)';
comment on column public.ts_feeds.created_at is 'DB 저장 일시';

-- 3. ts_insights (AI analysis results of feeds)
create table if not exists public.ts_insights (
  id uuid primary key default uuid_generate_v4(),
  feed_id uuid references public.ts_feeds(id) on delete cascade not null unique,
  relevance_score int check (relevance_score >= 0 and relevance_score <= 100),
  summary text,
  importance text check (importance in ('Low', 'Medium', 'High')),
  category text,
  created_at timestamptz default now()
);

comment on table public.ts_insights is 'Gemini AI가 분석한 피드별 경제 인사이트 정보';
comment on column public.ts_insights.feed_id is '분석 대상 피드 ID (ts_feeds 외래키)';
comment on column public.ts_insights.relevance_score is '경제/주식 관련성 점수 (0~100)';
comment on column public.ts_insights.summary is 'AI가 요약한 핵심 내용 (3줄 내외)';
comment on column public.ts_insights.importance is '인사이트의 중요도 (Low, Medium, High)';
comment on column public.ts_insights.category is '경제 카테고리 분류 (주식, 코인, 부동산, 거시경제, 방산, 조선 등)';
comment on column public.ts_insights.created_at is '분석 및 생성 일시';

-- 4. ts_settings (System configurations)
create table if not exists public.ts_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

comment on table public.ts_settings is '시스템 전역 설정 정보';
comment on column public.ts_settings.key is '설정 식별 키 (예: sync_interval)';
comment on column public.ts_settings.value is '설정 값 (JSON 또는 문자열)';

-- 5. ts_pipeline_logs (Execution history)
create table if not exists public.ts_pipeline_logs (
  id uuid primary key default uuid_generate_v4(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text check (status in ('완료', '수집 오류', '분석 오류', '진행중', 'success', 'error')),
  collected_count int default 0,
  analyzed_count int default 0,
  error_message text,
  created_at timestamptz default now()
);

comment on table public.ts_pipeline_logs is '데이터 파이프라인 실행 이력 로그';
comment on column public.ts_pipeline_logs.status is '실행 결과 상태 (완료, 수집 오류, 분석 오류, 진행중)';
comment on column public.ts_pipeline_logs.collected_count is '해당 실행 회차에서 수집된 신규 피드 수';
comment on column public.ts_pipeline_logs.analyzed_count is '해당 실행 회차에서 분석 완료된 인사이트 수';

-- Default Seeds
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *')
on conflict (key) do nothing;

-- Performance Indexes
create index if not exists idx_ts_experts_last_synced_at on public.ts_experts(last_synced_at);
create index if not exists idx_ts_feeds_expert_id on public.ts_feeds(expert_id);
create index if not exists idx_ts_insights_feed_id on public.ts_insights(feed_id);
create index if not exists idx_ts_pipeline_logs_started_at on public.ts_pipeline_logs(started_at);
