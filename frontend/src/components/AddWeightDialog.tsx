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
import { useAddWeightEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Animal } from '../backend';

interface AddWeightDialogProps {
  animal: Animal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWeightDialog({ animal, open, onOpenChange }: AddWeightDialogProps) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const addWeightMutation = useAddWeightEntry();

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

      await addWeightMutation.mutateAsync({
        animalId: animal.id,
        weight: BigInt(weightValue),
        timestamp,
      });

      toast.success('Weight entry added successfully');
      setWeight('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add weight entry');
      console.error('Error adding weight entry:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Weight Entry for {animal.name}</DialogTitle>
          <DialogDescription>
            Record a new weight measurement for this snake.
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
            <Button type="submit" disabled={addWeightMutation.isPending}>
              {addWeightMutation.isPending ? 'Adding...' : 'Add Weight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
