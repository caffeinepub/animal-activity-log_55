import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface RoleLoadingRecoveryScreenProps {
  title?: string;
  message?: string;
  onRecover: () => void;
  onReset: () => void;
  isRecovering?: boolean;
}

export function RoleLoadingRecoveryScreen({
  title = 'Error Loading User Role',
  message = 'User is not registered',
  onRecover,
  onReset,
  isRecovering = false,
}: RoleLoadingRecoveryScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onRecover}
            className="w-full"
            size="lg"
            variant="default"
            disabled={isRecovering}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Retry'}
          </Button>
          <Button
            onClick={onReset}
            className="w-full"
            size="lg"
            variant="outline"
            disabled={isRecovering}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset Offline Data
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            If retry doesn't work, try resetting offline data. This will clear all cached data and reload the app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
