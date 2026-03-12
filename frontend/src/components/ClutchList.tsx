import { useState } from 'react';
import { Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGetClutchHistoryForAnimal, useDeleteClutchEntry } from '../hooks/useQueries';
import { EditClutchEntryDialog } from './EditClutchEntryDialog';
import { toast } from 'sonner';
import type { AnimalId, ClutchEntry } from '../backend';

interface ClutchListProps {
  animalId: AnimalId;
}

export function ClutchList({ animalId }: ClutchListProps) {
  const { data: clutches, isLoading, error } = useGetClutchHistoryForAnimal(animalId);
  const [editingClutch, setEditingClutch] = useState<ClutchEntry | null>(null);
  const [deletingClutch, setDeletingClutch] = useState<ClutchEntry | null>(null);
  const deleteClutchMutation = useDeleteClutchEntry();

  const handleDelete = async () => {
    if (!deletingClutch) return;

    try {
      await deleteClutchMutation.mutateAsync(deletingClutch.id);
      toast.success('Clutch entry deleted successfully');
      setDeletingClutch(null);
    } catch (error) {
      toast.error('Failed to delete clutch entry');
      console.error('Error deleting clutch entry:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load clutch history.</AlertDescription>
      </Alert>
    );
  }

  if (!clutches || clutches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No clutch records yet. Click "Record Clutch" to add one.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedClutches = [...clutches].sort((a, b) => {
    return Number(b.timestamp) - Number(a.timestamp);
  });

  return (
    <>
      <div className="space-y-3">
        {sortedClutches.map((clutch) => {
          const date = new Date(Number(clutch.timestamp) / 1000000);
          return (
            <Card key={Number(clutch.id)}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClutch(clutch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingClutch(clutch)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {clutch.notes && (
                    <div className="pl-6">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {clutch.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingClutch && (
        <EditClutchEntryDialog
          clutch={editingClutch}
          open={!!editingClutch}
          onOpenChange={(open) => !open && setEditingClutch(null)}
        />
      )}

      <AlertDialog
        open={!!deletingClutch}
        onOpenChange={(open) => !open && setDeletingClutch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clutch Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this clutch record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
