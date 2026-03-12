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
import { Checkbox } from '@/components/ui/checkbox';
import { useAddBulkWeightsForSelectedAnimals } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { AnimalWithDaysSinceLastEvents, AnimalWeightUpdate } from '../backend';

interface BulkAddWeightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: AnimalWithDaysSinceLastEvents[];
}

export function BulkAddWeightsDialog({ open, onOpenChange, animals }: BulkAddWeightsDialogProps) {
  const [selectedAnimals, setSelectedAnimals] = useState<Set<string>>(new Set());
  const [weights, setWeights] = useState<Record<string, string>>({});
  const addBulkWeightsMutation = useAddBulkWeightsForSelectedAnimals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAnimals.size === 0) {
      toast.error('Please select at least one animal');
      return;
    }

    const weightUpdates: AnimalWeightUpdate[] = Array.from(selectedAnimals)
      .map((animalId) => {
        const weightStr = weights[animalId];
        if (!weightStr || weightStr.trim() === '') {
          return null;
        }
        const weight = parseInt(weightStr, 10);
        if (isNaN(weight) || weight <= 0) {
          return null;
        }
        return {
          animalId,
          weight: BigInt(weight),
        };
      })
      .filter((update): update is AnimalWeightUpdate => update !== null);

    if (weightUpdates.length === 0) {
      toast.error('Please enter valid weights for selected animals');
      return;
    }

    try {
      await addBulkWeightsMutation.mutateAsync(weightUpdates);
      toast.success(`Weights updated for ${weightUpdates.length} animal(s)`);
      setSelectedAnimals(new Set());
      setWeights({});
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update weights');
      console.error('Error updating weights:', error);
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

  const handleWeightChange = (animalId: string, value: string) => {
    setWeights((prev) => ({
      ...prev,
      [animalId]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Bulk Update Weights</DialogTitle>
          <DialogDescription>
            Select animals and enter their new weights. Each animal can have a different weight.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '80vh' }}>
            <div className="space-y-4 py-4 pr-2">
              {animals.map((item) => (
                <div
                  key={item.animal.id}
                  className="flex items-center gap-4 p-3 border border-border rounded-lg"
                >
                  <Checkbox
                    id={`animal-${item.animal.id}`}
                    checked={selectedAnimals.has(item.animal.id)}
                    onCheckedChange={() => toggleAnimal(item.animal.id)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`animal-${item.animal.id}`}
                      className="text-base font-medium cursor-pointer"
                    >
                      {item.animal.name}
                    </Label>
                    {item.animal.weight !== undefined && item.animal.weight !== null && (
                      <p className="text-sm text-muted-foreground">
                        Current: {item.animal.weight.toString()}g
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Weight (g)"
                      value={weights[item.animal.id] || ''}
                      onChange={(e) => handleWeightChange(item.animal.id, e.target.value)}
                      disabled={!selectedAnimals.has(item.animal.id)}
                      min="1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addBulkWeightsMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addBulkWeightsMutation.isPending}>
              {addBulkWeightsMutation.isPending ? 'Updating...' : 'Update Weights'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
