import { useState, useEffect } from 'react';
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
import { useEditMeal } from '../hooks/useQueries';
import type { Meal } from '../backend';

interface EditMealDialogProps {
  meal: Meal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMealDialog({ meal, open, onOpenChange }: EditMealDialogProps) {
  const [details, setDetails] = useState(meal.details);
  const editMealMutation = useEditMeal();

  useEffect(() => {
    if (open) {
      setDetails(meal.details);
    }
  }, [open, meal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!details.trim()) {
      toast.error('Please enter meal details');
      return;
    }

    try {
      await editMealMutation.mutateAsync({
        id: meal.id,
        details: details.trim(),
      });
      toast.success('Meal updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update meal');
      console.error('Error updating meal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Meal</DialogTitle>
          <DialogDescription>
            Update the details of this feeding session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-details">Meal Details</Label>
              <Textarea
                id="edit-details"
                placeholder="e.g., Medium rat, frozen/thawed, ate readily"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={editMealMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editMealMutation.isPending}>
              {editMealMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
