import { useState, useMemo } from 'react';
import { Plus, Users, Utensils, Weight, Edit2, Check, X, Droplet, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AddAnimalDialog } from './AddAnimalDialog';
import { BulkAddAnimalsDialog } from './BulkAddAnimalsDialog';
import { BulkAddMealsDialog } from './BulkAddMealsDialog';
import { BulkAddWeightsDialog } from './BulkAddWeightsDialog';
import { AnimalCard } from './AnimalCard';
import { useGetAnimalsWithDaysSinceLastEvents, useGetCustomHeading, useSetCustomHeading, useGetLastWaterChange, useUpdateWaterChange } from '../hooks/useQueries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { toast } from 'sonner';

export function AnimalList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [isBulkMealsDialogOpen, setIsBulkMealsDialogOpen] = useState(false);
  const [isBulkWeightsDialogOpen, setIsBulkWeightsDialogOpen] = useState(false);
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [headingInput, setHeadingInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search query with 200ms delay, but clear applies immediately
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  
  const { data: animalsWithDays, isLoading, error, refetch } = useGetAnimalsWithDaysSinceLastEvents();
  const { data: customHeading } = useGetCustomHeading();
  const setCustomHeadingMutation = useSetCustomHeading();
  const { data: lastWaterChange } = useGetLastWaterChange();
  const updateWaterChangeMutation = useUpdateWaterChange();

  const handleEditHeading = () => {
    setHeadingInput(customHeading || 'Animal Activity Log');
    setIsEditingHeading(true);
  };

  const handleSaveHeading = async () => {
    if (!headingInput.trim()) {
      toast.error('Heading cannot be empty');
      return;
    }

    try {
      await setCustomHeadingMutation.mutateAsync(headingInput.trim());
      setIsEditingHeading(false);
      toast.success('Heading updated successfully');
    } catch (error) {
      toast.error('Failed to update heading');
      console.error('Error updating heading:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingHeading(false);
    setHeadingInput('');
  };

  const handleUpdateWaterChange = async () => {
    try {
      await updateWaterChangeMutation.mutateAsync();
      toast.success('Water change date updated successfully');
    } catch (error) {
      toast.error('Failed to update water change date');
      console.error('Error updating water change:', error);
    }
  };

  const calculateDaysSinceWaterChange = (timestamp: bigint | null | undefined): string => {
    if (!timestamp) return 'Never changed';
    const now = Date.now();
    const waterChangeDate = Number(timestamp) / 1000000; // Convert nanoseconds to milliseconds
    const daysDiff = Math.floor((now - waterChangeDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Changed today';
    if (daysDiff === 1) return '1 day since last water change';
    return `${daysDiff} days since last water change`;
  };

  // Filter animals based on debounced search query - memoized to prevent unnecessary recalculations
  const filteredAnimals = useMemo(() => {
    if (!animalsWithDays) return [];
    if (!debouncedSearchQuery.trim()) return animalsWithDays;
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    return animalsWithDays.filter(item => 
      item.animal.name.toLowerCase().includes(query) ||
      item.animal.idNumber.toLowerCase().includes(query) ||
      item.animal.genes.toLowerCase().includes(query)
    );
  }, [animalsWithDays, debouncedSearchQuery]);

  // Calculate summary statistics (based on all animals, not filtered)
  const totalAnimals = animalsWithDays?.length || 0;
  const femaleCount = animalsWithDays?.filter(item => 
    item.animal.sex.toLowerCase() === 'female' || item.animal.sex.toLowerCase() === 'f'
  ).length || 0;
  const maleCount = animalsWithDays?.filter(item => 
    item.animal.sex.toLowerCase() === 'male' || item.animal.sex.toLowerCase() === 'm'
  ).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-4xl" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-16 w-full max-w-2xl" />
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>Failed to load animals data. Please try again.</span>
          <button
            onClick={() => refetch()}
            className="text-sm underline hover:no-underline w-fit"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  const animalCount = animalsWithDays?.length || 0;

  return (
    <div className="space-y-6">
      {/* Custom Heading Section */}
      <div className="w-full">
        {isEditingHeading ? (
          <div className="flex items-center gap-2 w-full">
            <Input
              value={headingInput}
              onChange={(e) => setHeadingInput(e.target.value)}
              placeholder="Enter custom heading"
              className="w-full max-w-4xl text-3xl font-bold h-auto py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveHeading();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSaveHeading}
              disabled={setCustomHeadingMutation.isPending}
              className="flex-shrink-0"
            >
              <Check className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={setCustomHeadingMutation.isPending}
              className="flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <h1 className="text-3xl font-bold text-foreground break-words">
              {customHeading || 'Animal Activity Log'}
            </h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditHeading}
              className="flex-shrink-0"
              aria-label="Edit heading"
            >
              <Edit2 className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {animalCount > 0 && (
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search animals by name, ID, or genes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Prevent any form submission behavior
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="pl-9"
          />
        </div>
      )}

      {/* Summary Section */}
      {totalAnimals > 0 && (
        <div className="px-4 py-2 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalAnimals}</span> {totalAnimals === 1 ? 'animal' : 'animals'} total
            {(femaleCount > 0 || maleCount > 0) && (
              <>
                {' • '}
                {femaleCount > 0 && (
                  <>
                    <span className="font-medium text-foreground">{femaleCount}</span> {femaleCount === 1 ? 'female' : 'females'}
                  </>
                )}
                {femaleCount > 0 && maleCount > 0 && ', '}
                {maleCount > 0 && (
                  <>
                    <span className="font-medium text-foreground">{maleCount}</span> {maleCount === 1 ? 'male' : 'males'}
                  </>
                )}
              </>
            )}
            {debouncedSearchQuery.trim() && (
              <>
                {' • '}
                <span className="font-medium text-foreground">{filteredAnimals.length}</span> {filteredAnimals.length === 1 ? 'match' : 'matches'} for "{debouncedSearchQuery}"
              </>
            )}
          </p>
        </div>
      )}

      {/* Last Water Change Section */}
      <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Water Change Status</p>
              <p className="text-sm text-muted-foreground">
                {calculateDaysSinceWaterChange(lastWaterChange)}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleUpdateWaterChange}
            disabled={updateWaterChangeMutation.isPending}
            size="sm"
            className="w-full sm:w-auto"
          >
            {updateWaterChangeMutation.isPending ? 'Updating...' : 'Update Water Change'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Animal
          </Button>
          <Button onClick={() => setIsBulkAddDialogOpen(true)} variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Bulk Add
          </Button>
          {animalCount > 0 && (
            <>
              <Button onClick={() => setIsBulkMealsDialogOpen(true)} variant="secondary">
                <Utensils className="mr-2 h-4 w-4" />
                Bulk Add Meals
              </Button>
              <Button onClick={() => setIsBulkWeightsDialogOpen(true)} variant="secondary">
                <Weight className="mr-2 h-4 w-4" />
                Bulk Add Weights
              </Button>
            </>
          )}
        </div>
      </div>

      {!animalsWithDays || animalsWithDays.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Animals Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start tracking your animals by adding your first one.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Animal
              </Button>
              <Button onClick={() => setIsBulkAddDialogOpen(true)} variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Bulk Add Animals
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredAnimals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Animals Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No animals match your search query "{debouncedSearchQuery}". Try a different search term.
            </p>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredAnimals.map((item) => (
            <AnimalCard key={item.animal.id} animalWithDays={item} />
          ))}
        </div>
      )}

      <AddAnimalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <BulkAddAnimalsDialog open={isBulkAddDialogOpen} onOpenChange={setIsBulkAddDialogOpen} />
      <BulkAddMealsDialog
        open={isBulkMealsDialogOpen}
        onOpenChange={setIsBulkMealsDialogOpen}
        animals={animalsWithDays || []}
      />
      <BulkAddWeightsDialog
        open={isBulkWeightsDialogOpen}
        onOpenChange={setIsBulkWeightsDialogOpen}
        animals={animalsWithDays || []}
      />
    </div>
  );
}
