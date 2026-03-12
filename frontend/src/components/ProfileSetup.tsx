import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { AlertCircle } from 'lucide-react';

export function ProfileSetup() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saveProfile = useSaveCallerUserProfile();

  useEffect(() => {
    if (saveProfile.isSuccess) {
      setError(null);
    }
  }, [saveProfile.isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
    } catch (err: any) {
      console.error('Profile setup error:', err);
      setError(err?.message || 'Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl sm:text-3xl">Welcome!</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Let's get started by setting up your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saveProfile.isPending}
                autoFocus
                className="text-base"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending || !name.trim()}
              size="lg"
            >
              {saveProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  Saving...
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
