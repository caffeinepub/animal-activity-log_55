import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Heart, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function LoginScreen() {
  const { login, loginStatus, loginError } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in' || isLoading;
  const hasLoginError = loginStatus === 'loginError';

  useEffect(() => {
    if (loginStatus === 'success') {
      setError(null);
      setIsLoading(false);
    } else if (hasLoginError) {
      setError(loginError?.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  }, [loginStatus, hasLoginError, loginError]);

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/assets/So daughter.png" 
              alt="S.O. Daughters Snakes Logo" 
              className="h-24 sm:h-32 w-auto object-contain"
              onError={(e) => {
                console.error('Failed to load logo image');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Animal Activity Log</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Track your ball python meals and manage your collection with ease
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Sign in to access your private snake collection and meal records
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </CardContent>
      </Card>
      <footer className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground px-4">
        © 2025. Built with <Heart className="inline h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary" />{' '}
        using{' '}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
