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
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEditClutchEntry } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { ClutchEntry } from '../backend';
import { cn } from '@/lib/utils';

interface EditClutchEntryDialogProps {
  clutch: ClutchEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClutchEntryDialog({ clutch, open, onOpenChange }: EditClutchEntryDialogProps) {
  const [date, setDate] = useState<Date>(new Date(Number(clutch.timestamp) / 1000000));
  const [notes, setNotes] = useState(clutch.notes);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const editMutation = useEditClutchEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const timestamp = BigInt(date.getTime() * 1000000);
      await editMutation.mutateAsync({
        id: clutch.id,
        animalId: clutch.animalId,
        timestamp,
        notes,
      });
      toast.success('Clutch entry updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating clutch entry:', error);
      toast.error('Failed to update clutch entry');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Clutch Entry</DialogTitle>
          <DialogDescription>Update the date and notes for this clutch entry.</DialogDescription>
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

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter clutch notes..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={editMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? (
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
