import { Moon, Sun, LogOut, Home, ClipboardList } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="border-b border-border bg-card safe-area-header">
      <div className="container mx-auto px-4 pt-safe pb-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {userProfile && (
              <p className="text-base sm:text-lg text-foreground truncate">Welcome, {userProfile.name}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 text-sm"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              <span className="hidden xs:inline">Logout</span>
              <span className="xs:hidden">Out</span>
            </Button>
          </div>
        </div>
        <nav className="flex gap-2 flex-wrap">
          <Button
            variant={currentPath === '/' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate({ to: '/' })}
            className="h-9 text-sm"
          >
            <Home className="mr-1.5 h-4 w-4" />
            <span className="hidden xs:inline">Animals</span>
            <span className="xs:hidden">List</span>
          </Button>
          <Button
            variant={currentPath === '/overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate({ to: '/overview' })}
            className="h-9 text-sm"
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Feeding & Pairing Overview</span>
            <span className="sm:hidden">Overview</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
