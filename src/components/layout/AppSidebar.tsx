import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Server,
  ShieldAlert,
  FileText,
  Terminal,
  Settings,
  Info,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discovery', icon: Radar, label: 'Network Discovery' },
  { to: '/devices', icon: Server, label: 'Device Inventory' },
  { to: '/vulnerabilities', icon: ShieldAlert, label: 'Vulnerabilities' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/logs', icon: Terminal, label: 'Live Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/about', icon: Info, label: 'About' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 cyber-glow-sm">
              <Shield className="w-6 h-6 text-primary" />
              <div className="absolute inset-0 rounded-lg border border-primary/30" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-sm font-bold text-sidebar-foreground">IoT Security</h1>
                <p className="text-xs text-muted-foreground">Scanner</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:bg-sidebar-accent',
                  isActive
                    ? 'bg-sidebar-accent text-primary cyber-border'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className={cn(
                  'w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10',
                  collapsed && 'justify-center px-0'
                )}
              >
                <LogOut className="w-5 h-5" />
                {!collapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Logout</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border hover:bg-primary hover:text-primary-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
