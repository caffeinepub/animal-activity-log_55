import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Heart, Edit, Trash2 } from 'lucide-react';
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
import { EditPairingDialog } from './EditPairingDialog';
import { useGetPairingHistoryForAnimal, useDeletePairingEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { PairingEntry } from '../backend';

interface PairingListProps {
  animalId: string;
}

export function PairingList({ animalId }: PairingListProps) {
  const { data: pairings, isLoading } = useGetPairingHistoryForAnimal(animalId);
  const [editingPairing, setEditingPairing] = useState<PairingEntry | null>(null);
  const [deletingPairing, setDeletingPairing] = useState<PairingEntry | null>(null);
  const deletePairingMutation = useDeletePairingEntry();

  const handleDelete = async () => {
    if (!deletingPairing) return;

    try {
      await deletePairingMutation.mutateAsync(deletingPairing.id);
      toast.success('Pairing entry deleted successfully');
      setDeletingPairing(null);
    } catch (error) {
      toast.error('Failed to delete pairing entry');
      console.error('Error deleting pairing entry:', error);
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

  if (!pairings || pairings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No pairing entries recorded yet. Add the first pairing to start tracking!</p>
      </div>
    );
  }

  // Sort pairings by timestamp (most recent first)
  const sortedPairings = [...pairings].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <>
      <div className="space-y-3">
        {sortedPairings.map((pairing) => (
          <div
            key={pairing.id.toString()}
            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(Number(pairing.timestamp) / 1000000), 'PPP')}
                  </span>
                </div>
                {pairing.notes && (
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-foreground">{pairing.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingPairing(pairing)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeletingPairing(pairing)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingPairing && (
        <EditPairingDialog
          pairingEntry={editingPairing}
          open={!!editingPairing}
          onOpenChange={(open) => !open && setEditingPairing(null)}
        />
      )}

      <AlertDialog
        open={!!deletingPairing}
        onOpenChange={(open) => !open && setDeletingPairing(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pairing Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this pairing record.
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
