import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/sonner';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
