import {requireUser} from '@/lib/auth';
import {AppShell} from '@/components/app-shell';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({children}: {children: React.ReactNode}) {
  const user = await requireUser();
  return (
    <AppShell user={user} fixture={process.env.AI_ADAPTER === 'fixture'}>
      {children}
    </AppShell>
  );
}
