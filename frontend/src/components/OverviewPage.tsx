import { Utensils, Heart, Weight, Droplet, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetAnimalsWithDaysSinceLastEvents, useGetLastWaterChange, useUpdateWaterChange } from '../hooks/useQueries';
import { toast } from 'sonner';

export function OverviewPage() {
  const { data: animalsWithDays, isLoading, error, refetch } = useGetAnimalsWithDaysSinceLastEvents();
  const { data: lastWaterChange } = useGetLastWaterChange();
  const updateWaterChangeMutation = useUpdateWaterChange();

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

  // Calculate summary statistics from all animals
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
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-16 w-full max-w-2xl" />
        <Skeleton className="h-96 w-full" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Overview
        </h1>
        <p className="text-muted-foreground">
          Quick view of all animals with their feeding, pairing, shed, and tub change schedules
        </p>
      </div>

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

      {!animalsWithDays || animalsWithDays.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Animals Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Add animals to see their overview.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Animals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Name</TableHead>
                    <TableHead className="w-[13%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Weight className="h-4 w-4" />
                        <span>Weight</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[16.75%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Utensils className="h-4 w-4" />
                        <span>Last Meal</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[16.75%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>Last Pairing</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[16.75%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Last Shed</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[16.75%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Droplet className="h-4 w-4" />
                        <span>Last Tub Change</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animalsWithDays.map((item) => (
                    <TableRow key={item.animal.id}>
                      <TableCell className="font-medium">
                        {item.animal.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.animal.weight !== undefined && item.animal.weight !== null ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-sm">
                            {Number(item.animal.weight)}g
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysSinceLastMeal !== undefined && item.daysSinceLastMeal !== null ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-sm">
                            {Number(item.daysSinceLastMeal)} {Number(item.daysSinceLastMeal) === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysSinceLastPairing !== undefined && item.daysSinceLastPairing !== null ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-sm">
                            {Number(item.daysSinceLastPairing)} {Number(item.daysSinceLastPairing) === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysSinceLastShed !== undefined && item.daysSinceLastShed !== null ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-sm">
                            {Number(item.daysSinceLastShed)} {Number(item.daysSinceLastShed) === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysSinceLastTubChange !== undefined && item.daysSinceLastTubChange !== null ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-muted text-sm">
                            {Number(item.daysSinceLastTubChange)} {Number(item.daysSinceLastTubChange) === 1 ? 'day' : 'days'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
