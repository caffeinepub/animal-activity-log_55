import { useState } from 'react';
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
import { useAddPairingEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Animal } from '../backend';

interface AddPairingDialogProps {
  animal: Animal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPairingDialog({ animal, open, onOpenChange }: AddPairingDialogProps) {
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const addPairingMutation = useAddPairingEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedDate = new Date(date);
      const timestamp = BigInt(selectedDate.getTime() * 1000000);

      await addPairingMutation.mutateAsync({
        animalId: animal.id,
        timestamp,
        notes: notes.trim(),
      });

      toast.success('Pairing entry added successfully');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add pairing entry');
      console.error('Error adding pairing entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Pairing Entry for {animal.name}</DialogTitle>
          <DialogDescription>
            Record a new pairing for this snake.
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
            <Button type="submit" disabled={addPairingMutation.isPending}>
              {addPairingMutation.isPending ? 'Adding...' : 'Add Pairing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
