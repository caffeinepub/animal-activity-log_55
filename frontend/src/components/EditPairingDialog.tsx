import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEditPairingEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { PairingEntry } from '../backend';

interface EditPairingDialogProps {
  pairingEntry: PairingEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPairingDialog({ pairingEntry, open, onOpenChange }: EditPairingDialogProps) {
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const editPairingMutation = useEditPairingEntry();

  useEffect(() => {
    if (pairingEntry) {
      setNotes(pairingEntry.notes);
      const entryDate = new Date(Number(pairingEntry.timestamp) / 1000000);
      setDate(entryDate.toISOString().split('T')[0]);
    }
  }, [pairingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedDate = new Date(date);
      const timestamp = BigInt(selectedDate.getTime() * 1000000);

      await editPairingMutation.mutateAsync({
        id: pairingEntry.id,
        timestamp,
        notes: notes.trim(),
      });

      toast.success('Pairing entry updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update pairing entry');
      console.error('Error updating pairing entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Pairing Entry</DialogTitle>
          <DialogDescription>
            Update the pairing information for this entry.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter any notes about this pairing..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editPairingMutation.isPending}>
              {editPairingMutation.isPending ? 'Updating...' : 'Update Pairing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
