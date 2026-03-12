import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEditShedEntry, useEditTubChangeEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { ShedEntry, TubChangeEntry } from '../backend';
import { cn } from '@/lib/utils';

interface EditShedTubChangeDialogProps {
  entry: {
    timestamp: bigint;
    shedEntry?: ShedEntry;
    tubChangeEntry?: TubChangeEntry;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditShedTubChangeDialog({ entry, open, onOpenChange }: EditShedTubChangeDialogProps) {
  const [date, setDate] = useState<Date>(new Date(Number(entry.timestamp) / 1000000));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const editShedMutation = useEditShedEntry();
  const editTubChangeMutation = useEditTubChangeEntry();

  const getEntryLabel = (): string => {
    const hasShed = !!entry.shedEntry;
    const hasTubChange = !!entry.tubChangeEntry;

    if (hasShed && hasTubChange) return 'Shed & Tub Change';
    if (hasShed) return 'Shed';
    if (hasTubChange) return 'Tub Change';
    return 'Unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const label = getEntryLabel();

    try {
      const timestamp = BigInt(date.getTime() * 1000000);
      
      // Update both shed and tub change entries if they exist
      const promises: Promise<void>[] = [];
      if (entry.shedEntry) {
        promises.push(
          editShedMutation.mutateAsync({
            id: entry.shedEntry.id,
            animalId: entry.shedEntry.animalId,
            timestamp,
          })
        );
      }
      if (entry.tubChangeEntry) {
        promises.push(
          editTubChangeMutation.mutateAsync({
            id: entry.tubChangeEntry.id,
            animalId: entry.tubChangeEntry.animalId,
            timestamp,
          })
        );
      }

      await Promise.all(promises);
      toast.success(`${label} entry updated successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating shed/tub change entry:', error);
      toast.error(`Failed to update ${label.toLowerCase()} entry`);
    }
  };

  const isLoading = editShedMutation.isPending || editTubChangeMutation.isPending;
  const label = getEntryLabel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {label} Entry</DialogTitle>
          <DialogDescription>Update the date for this {label.toLowerCase()} entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
