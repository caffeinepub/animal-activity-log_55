import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FileText, Edit, Trash2 } from 'lucide-react';
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
import { EditMealDialog } from './EditMealDialog';
import { useGetMealsForAnimal, useDeleteMeal } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Meal } from '../backend';

interface MealListProps {
  animalId: string;
}

export function MealList({ animalId }: MealListProps) {
  const { data: meals, isLoading } = useGetMealsForAnimal(animalId);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null);
  const deleteMealMutation = useDeleteMeal();

  const handleDelete = async () => {
    if (!deletingMeal) return;

    try {
      await deleteMealMutation.mutateAsync(deletingMeal.id);
      toast.success('Meal deleted successfully');
      setDeletingMeal(null);
    } catch (error) {
      toast.error('Failed to delete meal');
      console.error('Error deleting meal:', error);
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

  if (!meals || meals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No meals recorded yet. Add the first meal to start tracking!</p>
      </div>
    );
  }

  // Sort meals by timestamp (most recent first)
  const sortedMeals = [...meals].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <>
      <div className="space-y-3">
        {sortedMeals.map((meal) => (
          <div
            key={meal.id.toString()}
            className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(Number(meal.timestamp) / 1000000), 'PPpp')}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-foreground">{meal.details}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingMeal(meal)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeletingMeal(meal)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingMeal && (
        <EditMealDialog
          meal={editingMeal}
          open={!!editingMeal}
          onOpenChange={(open) => !open && setEditingMeal(null)}
        />
      )}

      <AlertDialog
        open={!!deletingMeal}
        onOpenChange={(open) => !open && setDeletingMeal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this meal record.
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
