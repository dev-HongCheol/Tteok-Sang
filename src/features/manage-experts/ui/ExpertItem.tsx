'use client';

import { useState } from 'react';
import type { Expert } from '@/entities/expert/model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { deleteExpert, updateExpert } from '@/entities/expert/api/expert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Twitter, Edit2, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ExpertItemProps {
  expert: Expert;
}

export function ExpertItem({ expert }: ExpertItemProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(expert.name);

  // 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: () => updateExpert(expert.id, { name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      setIsEditing(false);
      toast.success('이름이 수정되었습니다.');
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => deleteExpert(expert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('전문가가 삭제되었습니다.');
    },
  });

  const handleOpenTwitter = () => {
    window.open(`https://x.com/${expert.twitter_handle}`, '_blank');
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-[200px]"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate()}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="font-semibold text-lg">{expert.name}</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>@{expert.twitter_handle}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleOpenTwitter}
                title="X(Twitter) 방문"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          disabled={isEditing}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('정말 삭제하시겠습니까?')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
