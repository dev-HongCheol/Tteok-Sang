import { AdminSidebar } from '@/features/manage-system/ui/AdminSidebar';
import { Separator } from '@/shared/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar';

/**
 * 어드민 전용 공통 레이아웃 컴포넌트입니다.
 * @param {Object} props 컴포넌트 Props
 * @param {React.ReactNode} props.children 하위 페이지 컴포넌트
 * @returns {JSX.Element} 사이드바가 포함된 어드민 레이아웃
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4 md:p-8'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
