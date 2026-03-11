/**
 * 새로운 수집 대상 전문가를 등록하기 위한 폼 컴포넌트입니다.
 */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { addExpert } from '@/entities/expert/api/expert';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const expertSchema = z.object({
  twitter_handle: z.string().min(1, '트위터 핸들을 입력해주세요.'),
  name: z.string().optional(),
});

type ExpertFormValues = z.infer<typeof expertSchema>;

/**
 * 트위터 ID와 이름을 입력받아 신규 전문가를 등록하는 컴포넌트입니다.
 * @returns {JSX.Element} 전문가 등록 폼 UI
 */
export function AddExpertForm() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpertFormValues>({
    resolver: zodResolver(expertSchema),
  });

  const mutation = useMutation({
    mutationFn: addExpert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('전문가가 등록되었습니다.');
      reset();
    },
    onError: (error: any) => {
      toast.error(`등록 실패: ${error.message}`);
    },
  });

  const onSubmit = (data: ExpertFormValues) => {
    mutation.mutate({
      twitter_handle: data.twitter_handle,
      // 이름이 없으면 트위터 핸들을 이름으로 사용
      name: data.name || data.twitter_handle,
      // 등록 시점부터 수집을 시작하기 위해 현재 시간으로 초기화
      last_synced_at: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mb-8 flex flex-col gap-4'>
      <div className='flex gap-2'>
        <div className='flex-1'>
          <Input
            {...register('twitter_handle')}
            placeholder='트위터 ID (예: Alisvolatprop12)'
            className={errors.twitter_handle ? 'border-destructive' : ''}
          />
        </div>
        <div className='flex-1'>
          <Input
            {...register('name')}
            placeholder='전문가 이름 (미입력 시 ID 사용)'
            className={errors.name ? 'border-destructive' : ''}
          />
        </div>
        <Button type='submit' disabled={mutation.isPending}>
          {mutation.isPending ? '추가 중...' : '추가'}
        </Button>
      </div>
      {(errors.twitter_handle || errors.name) && (
        <p className='text-xs text-destructive'>
          {errors.twitter_handle?.message || errors.name?.message}
        </p>
      )}
    </form>
  );
}
