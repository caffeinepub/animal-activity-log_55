import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Weight, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { EditWeightDialog } from './EditWeightDialog';
import { useGetWeightHistoryForAnimal, useDeleteWeightEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { WeightEntry } from '../backend';

interface WeightListProps {
  animalId: string;
}

export function WeightList({ animalId }: WeightListProps) {
  const { data: weights, isLoading } = useGetWeightHistoryForAnimal(animalId);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [deletingWeight, setDeletingWeight] = useState<WeightEntry | null>(null);
  const deleteWeightMutation = useDeleteWeightEntry();

  const handleDelete = async () => {
    if (!deletingWeight) return;

    try {
      await deleteWeightMutation.mutateAsync(deletingWeight.id);
      toast.success('Weight entry deleted successfully');
      setDeletingWeight(null);
    } catch (error) {
      toast.error('Failed to delete weight entry');
      console.error('Error deleting weight entry:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!weights || weights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No weight entries recorded yet. Add the first weight to start tracking!</p>
      </div>
    );
  }

  // Sort weights by timestamp (most recent first)
  const sortedWeights = [...weights].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <>
      <div className="space-y-3">
        {sortedWeights.map((weight) => (
          <div
            key={weight.id.toString()}
            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(Number(weight.timestamp) / 1000000), 'PPP')}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Weight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-foreground font-medium">{weight.weight.toString()}g</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingWeight(weight)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeletingWeight(weight)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingWeight && (
        <EditWeightDialog
          weightEntry={editingWeight}
          open={!!editingWeight}
          onOpenChange={(open) => !open && setEditingWeight(null)}
        />
      )}

      <AlertDialog
        open={!!deletingWeight}
        onOpenChange={(open) => !open && setDeletingWeight(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Weight Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this weight record.
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
