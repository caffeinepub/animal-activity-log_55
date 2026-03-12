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
import { Checkbox } from '@/components/ui/checkbox';
import { useAddBulkMealsForSelectedAnimals } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { AnimalWithDaysSinceLastEvents } from '../backend';

interface BulkAddMealsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: AnimalWithDaysSinceLastEvents[];
}

export function BulkAddMealsDialog({ open, onOpenChange, animals }: BulkAddMealsDialogProps) {
  const [selectedAnimals, setSelectedAnimals] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const addBulkMealsMutation = useAddBulkMealsForSelectedAnimals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAnimals.size === 0) {
      toast.error('Please select at least one animal');
      return;
    }

    if (!details.trim()) {
      toast.error('Please enter meal details');
      return;
    }

    const timestamp = BigInt(new Date(date).getTime() * 1000000);

    try {
      await addBulkMealsMutation.mutateAsync({
        animalIds: Array.from(selectedAnimals),
        details: details.trim(),
        timestamp,
      });
      toast.success(`Meal added for ${selectedAnimals.size} animal(s)`);
      setSelectedAnimals(new Set());
      setDetails('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add meals');
      console.error('Error adding meals:', error);
    }
  };

  const toggleAnimal = (animalId: string) => {
    const newSelected = new Set(selectedAnimals);
    if (newSelected.has(animalId)) {
      newSelected.delete(animalId);
    } else {
      newSelected.add(animalId);
    }
    setSelectedAnimals(newSelected);
  };

  const toggleAll = () => {
    if (selectedAnimals.size === animals.length) {
      setSelectedAnimals(new Set());
    } else {
      setSelectedAnimals(new Set(animals.map((item) => item.animal.id)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Bulk Add Meals</DialogTitle>
          <DialogDescription>
            Select animals and add the same meal for all of them at once.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 pb-4 flex-shrink-0">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Meal Details</Label>
              <Textarea
                id="details"
                placeholder="e.g., Medium rat, frozen/thawed"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                required
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Label>Select Animals</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedAnimals.size === animals.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '80vh' }}>
            <div className="space-y-2 pr-2">
              {animals.map((item) => (
                <div
                  key={item.animal.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <Checkbox
                    id={`animal-${item.animal.id}`}
                    checked={selectedAnimals.has(item.animal.id)}
                    onCheckedChange={() => toggleAnimal(item.animal.id)}
                  />
                  <Label
                    htmlFor={`animal-${item.animal.id}`}
                    className="flex-1 text-base font-medium cursor-pointer"
                  >
                    {item.animal.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addBulkMealsMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addBulkMealsMutation.isPending}>
              {addBulkMealsMutation.isPending ? 'Adding...' : 'Add Meals'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
