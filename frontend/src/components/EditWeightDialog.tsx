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
import { useEditWeightEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { WeightEntry } from '../backend';

interface EditWeightDialogProps {
  weightEntry: WeightEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWeightDialog({ weightEntry, open, onOpenChange }: EditWeightDialogProps) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const editWeightMutation = useEditWeightEntry();

  useEffect(() => {
    if (weightEntry) {
      setWeight(weightEntry.weight.toString());
      const entryDate = new Date(Number(weightEntry.timestamp) / 1000000);
      setDate(entryDate.toISOString().split('T')[0]);
    }
  }, [weightEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weight.trim()) {
      toast.error('Please enter a weight');
      return;
    }

    const weightValue = parseInt(weight, 10);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    try {
      const selectedDate = new Date(date);
      const timestamp = BigInt(selectedDate.getTime() * 1000000);

      await editWeightMutation.mutateAsync({
        id: weightEntry.id,
        weight: BigInt(weightValue),
        timestamp,
      });

      toast.success('Weight entry updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update weight entry');
      console.error('Error updating weight entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Weight Entry</DialogTitle>
          <DialogDescription>
            Update the weight measurement for this entry.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter weight in grams"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="1"
                step="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
            <Button type="submit" disabled={editWeightMutation.isPending}>
              {editWeightMutation.isPending ? 'Updating...' : 'Update Weight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
