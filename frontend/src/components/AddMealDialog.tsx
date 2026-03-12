import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAddMeal } from '../hooks/useQueries';
import type { Animal } from '../backend';

interface AddMealDialogProps {
  animal: Animal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMealDialog({ animal, open, onOpenChange }: AddMealDialogProps) {
  const [details, setDetails] = useState('');
  const [dateTime, setDateTime] = useState('');
  const addMealMutation = useAddMeal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!details.trim()) {
      toast.error('Please enter meal details');
      return;
    }

    try {
      let timestamp: bigint;
      if (dateTime) {
        // Convert the datetime-local input to nanoseconds
        const date = new Date(dateTime);
        timestamp = BigInt(date.getTime()) * BigInt(1000000);
      } else {
        // Use current time
        timestamp = BigInt(Date.now()) * BigInt(1000000);
      }

      await addMealMutation.mutateAsync({
        animalId: animal.id,
        details: details.trim(),
        timestamp,
      });
      toast.success('Meal recorded successfully');
      setDetails('');
      setDateTime('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record meal');
      console.error('Error adding meal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Meal for {animal.name}</DialogTitle>
          <DialogDescription>Record the details of this feeding session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="datetime">Date & Time (optional)</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use current date and time.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Meal Details</Label>
              <Textarea
                id="details"
                placeholder="e.g., Medium rat, frozen/thawed, ate readily"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                autoFocus
                className="w-full resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include food type, size, and any relevant observations.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMealMutation.isPending}>
              {addMealMutation.isPending ? 'Recording...' : 'Record Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
