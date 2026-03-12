import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface BootstrapTimeoutScreenProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  onReset: () => void;
}

export function BootstrapTimeoutScreen({
  title = 'Loading Timeout',
  message = 'The app is taking longer than expected to load. This might be due to a slow connection or cached data.',
  onRetry,
  onReset,
}: BootstrapTimeoutScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-warning" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onRetry}
            className="w-full"
            size="lg"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button
            onClick={onReset}
            className="w-full"
            size="lg"
            variant="outline"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset Offline Data
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            If the problem persists, try resetting offline data. This will clear all cached data and reload the app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
