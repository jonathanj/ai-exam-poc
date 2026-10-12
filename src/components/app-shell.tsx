'use client';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {BookOpen, Files, Plus, LogOut, GraduationCap, ChevronRight} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
export function AppShell({
  children,
  user,
  fixture,
}: {
  children: React.ReactNode;
  user: {name: string; email: string};
  fixture: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  return (
    <SidebarProvider>
      <Sidebar variant='inset'>
        <SidebarHeader className='p-5'>
          <Link href='/exams' className='flex items-center gap-3'>
            <div className='size-9 flex items-center justify-center rounded-lg bg-primary text-white'>
              <BookOpen className='size-5' />
            </div>
            <div>
              <span className='font-semibold tracking-tight'>Exam Studio</span>
              <span className='block text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5'>
                Examiner workspace
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className='px-3'>
          <p className='eyebrow text-muted-foreground px-3 pt-6 pb-3'>WORKSPACE</p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={path === '/exams'}>
                <Link href='/exams'>
                  <Files />
                  <span>My exams</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={path === '/exams/new'}>
                <Link href='/exams/new'>
                  <Plus />
                  <span>Create an exam</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className='mt-auto mx-2 mb-6 rounded-xl bg-secondary p-4'>
            <GraduationCap className='size-6 text-primary mb-3' />
            <p className='text-sm font-medium'>Built around your judgement</p>
            <p className='text-xs text-muted-foreground leading-relaxed mt-2'>
              AI helps you draft. You decide what belongs in the paper.
            </p>
            <span className='inline-block text-[10px] mt-4 uppercase tracking-wider text-primary'>
              Grade 7 · Mathematics
            </span>
          </div>
        </SidebarContent>
        <SidebarFooter className='border-t p-4'>
          <div className='flex items-center gap-3'>
            <div className='size-9 rounded-full bg-secondary text-primary font-medium flex items-center justify-center'>
              {user.name.slice(0, 1)}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium truncate'>{user.name}</p>
              <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Sign out'
              onClick={async () => {
                await fetch('/api/auth/logout', {method: 'POST'});
                router.push('/login');
                router.refresh();
              }}
            >
              <LogOut className='size-4' />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className='min-w-0'>
        <header className='h-16 border-b bg-card flex items-center px-5 gap-3'>
          <SidebarTrigger />
          <span className='text-sm text-muted-foreground'>Workspace</span>
          <ChevronRight className='size-3 text-muted-foreground' />
          <span className='text-sm font-medium'>
            {path === '/exams/new' ? 'New exam' : path === '/exams' ? 'My exams' : 'Exam editor'}
          </span>
          <span className='ml-auto text-[11px] text-muted-foreground border rounded-full px-3 py-1'>
            {fixture ? 'Fixture AI · demo mode' : 'Authoring POC'}
          </span>
        </header>
        {fixture && (
          <div className='bg-amber-50 text-amber-900 px-6 py-2 text-xs border-b border-amber-200'>
            Deterministic fixture mode is enabled. Generated content is sample data, not a live AI
            response.
          </div>
        )}
        <main className='p-5 md:p-8 xl:p-10 min-w-0'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
