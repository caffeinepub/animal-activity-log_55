import { useState } from 'react';
import { Pencil, Trash2, Plus, Utensils, Weight, Heart, Sparkles, Droplet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EditAnimalDialog } from './EditAnimalDialog';
import { AddMealDialog } from './AddMealDialog';
import { AddWeightDialog } from './AddWeightDialog';
import { AddPairingDialog } from './AddPairingDialog';
import { RecordClutchDialog } from './RecordClutchDialog';
import { MealList } from './MealList';
import { WeightList } from './WeightList';
import { PairingList } from './PairingList';
import { ClutchList } from './ClutchList';
import { ShedTubChangeList } from './ShedTubChangeList';
import { PrintSnakeDetails } from './PrintSnakeDetails';
import { useDeleteAnimal, useLogShedOnly, useLogTubChangeOnly, useGetMealsForAnimal, useGetWeightHistoryForAnimal, useGetPairingHistoryForAnimal, useGetClutchHistoryForAnimal, useGetShedHistoryForAnimal, useGetTubChangeHistoryForAnimal } from '../hooks/useQueries';
import { calculateAge, formatAge } from '../lib/ageCalculator';
import type { AnimalWithDaysSinceLastEvents } from '../backend';
import { toast } from 'sonner';

interface AnimalCardProps {
  animalWithDays: AnimalWithDaysSinceLastEvents;
}

export function AnimalCard({ animalWithDays }: AnimalCardProps) {
  const { animal, daysSinceLastMeal, daysSinceLastPairing, daysSinceLastShed, daysSinceLastTubChange } = animalWithDays;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [isAddWeightDialogOpen, setIsAddWeightDialogOpen] = useState(false);
  const [isAddPairingDialogOpen, setIsAddPairingDialogOpen] = useState(false);
  const [isRecordClutchDialogOpen, setIsRecordClutchDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const deleteAnimal = useDeleteAnimal();
  const logShedOnly = useLogShedOnly();
  const logTubChangeOnly = useLogTubChangeOnly();

  const { data: meals = [] } = useGetMealsForAnimal(animal.id);
  const { data: weights = [] } = useGetWeightHistoryForAnimal(animal.id);
  const { data: pairings = [] } = useGetPairingHistoryForAnimal(animal.id);
  const { data: clutches = [] } = useGetClutchHistoryForAnimal(animal.id);
  const { data: sheds = [] } = useGetShedHistoryForAnimal(animal.id);
  const { data: tubChanges = [] } = useGetTubChangeHistoryForAnimal(animal.id);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${animal.name}?`)) return;

    try {
      await deleteAnimal.mutateAsync(animal.id);
      toast.success('Animal deleted successfully');
    } catch (error) {
      console.error('Error deleting animal:', error);
      toast.error('Failed to delete animal');
    }
  };

  const handleLogShed = async () => {
    try {
      await logShedOnly.mutateAsync(animal.id);
      toast.success('Shed recorded successfully');
    } catch (error) {
      console.error('Error logging shed:', error);
      toast.error('Failed to record shed');
    }
  };

  const handleLogTubChange = async () => {
    try {
      await logTubChangeOnly.mutateAsync(animal.id);
      toast.success('Tub change recorded successfully');
    } catch (error) {
      console.error('Error logging tub change:', error);
      toast.error('Failed to record tub change');
    }
  };

  const handlePrintDetails = () => {
    setIsPrinting(true);
  };

  const handlePrintComplete = () => {
    setIsPrinting(false);
  };

  const age = calculateAge(animal.birthday);
  const imageUrl = animal.picture?.getDirectURL();

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            {imageUrl && (
              <div className="w-full sm:w-32 h-32 flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={animal.name}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-xl sm:text-2xl break-words">{animal.name}</CardTitle>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={deleteAnimal.isPending}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">ID:</span> {animal.idNumber}</p>
                <p><span className="font-semibold text-foreground">Genes:</span> {animal.genes}</p>
                <p><span className="font-semibold text-foreground">Sex:</span> {animal.sex}</p>
                {age && <p><span className="font-semibold text-foreground">Age:</span> {formatAge(age)}</p>}
                {animal.weight !== undefined && animal.weight !== null && (
                  <p><span className="font-semibold text-foreground">Weight:</span> {animal.weight.toString()}g</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {daysSinceLastMeal !== undefined && daysSinceLastMeal !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Utensils className="h-3 w-3" />
                    {Number(daysSinceLastMeal)} {Number(daysSinceLastMeal) === 1 ? 'day' : 'days'} since meal
                  </span>
                )}
                {daysSinceLastPairing !== undefined && daysSinceLastPairing !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
                    <Heart className="h-3 w-3" />
                    {Number(daysSinceLastPairing)} {Number(daysSinceLastPairing) === 1 ? 'day' : 'days'} since pairing
                  </span>
                )}
                {daysSinceLastShed !== undefined && daysSinceLastShed !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    {Number(daysSinceLastShed)} {Number(daysSinceLastShed) === 1 ? 'day' : 'days'} since shed
                  </span>
                )}
                {daysSinceLastTubChange !== undefined && daysSinceLastTubChange !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    <Droplet className="h-3 w-3" />
                    {Number(daysSinceLastTubChange)} {Number(daysSinceLastTubChange) === 1 ? 'day' : 'days'} since tub change
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Button
              onClick={() => setIsAddMealDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Meal
            </Button>
            <Button
              onClick={() => setIsAddWeightDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Weight className="mr-1.5 h-3.5 w-3.5" />
              Add Weight
            </Button>
            <Button
              onClick={() => setIsAddPairingDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Heart className="mr-1.5 h-3.5 w-3.5" />
              Add Pairing
            </Button>
            <Button
              onClick={() => setIsRecordClutchDialogOpen(true)}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record Clutch
            </Button>
            <Button
              onClick={handleLogShed}
              disabled={logShedOnly.isPending}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {logShedOnly.isPending ? 'Logging...' : 'Log Shed'}
            </Button>
            <Button
              onClick={handleLogTubChange}
              disabled={logTubChangeOnly.isPending}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
            >
              <Droplet className="mr-1.5 h-3.5 w-3.5" />
              {logTubChangeOnly.isPending ? 'Logging...' : 'Log Tub Change'}
            </Button>
            <Button
              onClick={handlePrintDetails}
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs col-span-2 sm:col-span-3 lg:col-span-6"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Details
            </Button>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Meal History ({meals.length})</span>
                <span className="text-xs text-muted-foreground">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <MealList animalId={animal.id} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Weight History ({weights.length})</span>
                <span className="text-xs text-muted-foreground">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <WeightList animalId={animal.id} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Pairing History ({pairings.length})</span>
                <span className="text-xs text-muted-foreground">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <PairingList animalId={animal.id} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Clutch History ({clutches.length})</span>
                <span className="text-xs text-muted-foreground">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ClutchList animalId={animal.id} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="font-semibold">Shed & Tub Change History ({sheds.length})</span>
                <span className="text-xs text-muted-foreground">Click to expand</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ShedTubChangeList animalId={animal.id} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <EditAnimalDialog
        animal={animal}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      <AddMealDialog
        animal={animal}
        open={isAddMealDialogOpen}
        onOpenChange={setIsAddMealDialogOpen}
      />
      <AddWeightDialog
        animal={animal}
        open={isAddWeightDialogOpen}
        onOpenChange={setIsAddWeightDialogOpen}
      />
      <AddPairingDialog
        animal={animal}
        open={isAddPairingDialogOpen}
        onOpenChange={setIsAddPairingDialogOpen}
      />
      <RecordClutchDialog
        animal={animal}
        open={isRecordClutchDialogOpen}
        onOpenChange={setIsRecordClutchDialogOpen}
      />
      {isPrinting && (
        <PrintSnakeDetails
          animal={animal}
          meals={meals}
          weights={weights}
          pairings={pairings}
          clutches={clutches}
          sheds={sheds}
          tubChanges={tubChanges}
          onPrintComplete={handlePrintComplete}
        />
      )}
    </>
  );
}
