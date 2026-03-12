import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Sparkles, Droplet, Edit, Trash2 } from 'lucide-react';
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
import { useGetShedHistoryForAnimal, useGetTubChangeHistoryForAnimal, useDeleteShedEntry, useDeleteTubChangeEntry } from '../hooks/useQueries';
import { EditShedTubChangeDialog } from './EditShedTubChangeDialog';
import { toast } from 'sonner';
import type { ShedEntry, TubChangeEntry } from '../backend';

interface ShedTubChangeListProps {
  animalId: string;
}

interface CombinedEntry {
  timestamp: bigint;
  shedEntry?: ShedEntry;
  tubChangeEntry?: TubChangeEntry;
}

export function ShedTubChangeList({ animalId }: ShedTubChangeListProps) {
  const { data: sheds, isLoading: shedsLoading } = useGetShedHistoryForAnimal(animalId);
  const { data: tubChanges, isLoading: tubChangesLoading } = useGetTubChangeHistoryForAnimal(animalId);
  const [editingEntry, setEditingEntry] = useState<CombinedEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<CombinedEntry | null>(null);
  const deleteShedMutation = useDeleteShedEntry();
  const deleteTubChangeMutation = useDeleteTubChangeEntry();

  const isLoading = shedsLoading || tubChangesLoading;

  const getEntryLabel = (entry: CombinedEntry): string => {
    const hasShed = !!entry.shedEntry;
    const hasTubChange = !!entry.tubChangeEntry;

    if (hasShed && hasTubChange) return 'Shed & Tub Change';
    if (hasShed) return 'Shed';
    if (hasTubChange) return 'Tub Change';
    return 'Unknown';
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;

    const label = getEntryLabel(deletingEntry);

    try {
      const promises: Promise<void>[] = [];
      if (deletingEntry.shedEntry) {
        promises.push(deleteShedMutation.mutateAsync(deletingEntry.shedEntry.id));
      }
      if (deletingEntry.tubChangeEntry) {
        promises.push(deleteTubChangeMutation.mutateAsync(deletingEntry.tubChangeEntry.id));
      }

      await Promise.all(promises);
      toast.success(`${label} entry deleted successfully`);
      setDeletingEntry(null);
    } catch (error) {
      toast.error(`Failed to delete ${label.toLowerCase()} entry`);
      console.error('Error deleting shed/tub change entry:', error);
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

  if ((!sheds || sheds.length === 0) && (!tubChanges || tubChanges.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No shed or tub change records yet. Add the first entry to start tracking!</p>
      </div>
    );
  }

  // Create a map to group shed and tub changes by timestamp
  const timestampMap = new Map<string, CombinedEntry>();

  // Process sheds
  (sheds || []).forEach(shed => {
    const key = shed.timestamp.toString();
    const existing = timestampMap.get(key) || { timestamp: shed.timestamp };
    existing.shedEntry = shed;
    timestampMap.set(key, existing);
  });

  // Process tub changes
  (tubChanges || []).forEach(tub => {
    const key = tub.timestamp.toString();
    const existing = timestampMap.get(key) || { timestamp: tub.timestamp };
    existing.tubChangeEntry = tub;
    timestampMap.set(key, existing);
  });

  // Convert to array and sort by timestamp (most recent first)
  const combinedEntries = Array.from(timestampMap.values())
    .sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <>
      <div className="space-y-3">
        {combinedEntries.map((entry) => {
          const label = getEntryLabel(entry);
          const hasShed = !!entry.shedEntry;
          const hasTubChange = !!entry.tubChangeEntry;

          return (
            <div
              key={entry.timestamp.toString()}
              className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(Number(entry.timestamp) / 1000000), 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    {hasShed && hasTubChange ? (
                      <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    ) : hasShed ? (
                      <Sparkles className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Droplet className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    )}
                    <p className="text-foreground font-medium">{label}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingEntry(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingEntry(entry)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingEntry && (
        <EditShedTubChangeDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
        />
      )}

      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingEntry ? getEntryLabel(deletingEntry) : ''} Entry?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deletingEntry ? getEntryLabel(deletingEntry).toLowerCase() : ''} record.
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
