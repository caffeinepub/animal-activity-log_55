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
import { useRecordClutch } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Animal } from '../backend';
import { cn } from '@/lib/utils';

interface RecordClutchDialogProps {
  animal: Animal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordClutchDialog({ animal, open, onOpenChange }: RecordClutchDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const recordClutchMutation = useRecordClutch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const timestamp = BigInt(date.getTime() * 1000000);

      await recordClutchMutation.mutateAsync({
        animalId: animal.id,
        notes,
      });
      toast.success('Clutch recorded successfully');
      setNotes('');
      setDate(new Date());
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record clutch');
      console.error('Error recording clutch:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Clutch for {animal.name}</DialogTitle>
          <DialogDescription>
            Record a clutch event with date and notes.
          </DialogDescription>
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
                placeholder="Enter clutch details (e.g., number of eggs, observations, etc.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={recordClutchMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={recordClutchMutation.isPending}>
              {recordClutchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Clutch'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

