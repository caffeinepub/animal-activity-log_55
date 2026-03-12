import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { useAddBulkSnakes } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { BulkSnakeEntry } from '../backend';

interface AddAnimalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SnakeFormEntry {
  tempId: string;
  name: string;
  idNumber: string;
  genes: string;
  sex: string;
  birthday: string;
  weight: string;
  pictureFile: File | null;
  picturePreview: string | null;
}

export function BulkAddAnimalsDialog({ open, onOpenChange }: AddAnimalsDialogProps) {
  const [snakes, setSnakes] = useState<SnakeFormEntry[]>([
    { tempId: '1', name: '', idNumber: '', genes: '', sex: '', birthday: '', weight: '', pictureFile: null, picturePreview: null },
  ]);
  const addBulkSnakesMutation = useAddBulkSnakes();

  const addSnakeRow = () => {
    setSnakes([
      ...snakes,
      { tempId: Date.now().toString(), name: '', idNumber: '', genes: '', sex: '', birthday: '', weight: '', pictureFile: null, picturePreview: null },
    ]);
  };

  const removeSnakeRow = (tempId: string) => {
    if (snakes.length > 1) {
      setSnakes(snakes.filter((s) => s.tempId !== tempId));
    }
  };

  const updateSnake = (tempId: string, field: keyof SnakeFormEntry, value: string) => {
    setSnakes(snakes.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s)));
  };

  const handlePictureChange = (tempId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSnakes(snakes.map((s) => 
          s.tempId === tempId 
            ? { ...s, pictureFile: file, picturePreview: reader.result as string }
            : s
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = (tempId: string) => {
    setSnakes(snakes.map((s) => 
      s.tempId === tempId 
        ? { ...s, pictureFile: null, picturePreview: null }
        : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSnakes = snakes.filter((s) => s.name.trim() && s.idNumber.trim() && s.genes.trim() && s.sex);

    if (validSnakes.length === 0) {
      toast.error('Please fill in at least one complete snake entry');
      return;
    }

    if (validSnakes.length < snakes.length) {
      toast.warning('Some incomplete entries will be skipped');
    }

    try {
      const snakesToAdd: BulkSnakeEntry[] = await Promise.all(
        validSnakes.map(async ({ name, idNumber, genes, sex, birthday, weight, pictureFile }) => {
          let pictureBlob: ExternalBlob | undefined = undefined;
          if (pictureFile) {
            const arrayBuffer = await pictureFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            pictureBlob = ExternalBlob.fromBytes(uint8Array);
          }

          return {
            name: name.trim(),
            idNumber: idNumber.trim(),
            genes: genes.trim(),
            sex,
            birthday: birthday ? BigInt(new Date(birthday).getTime()) * BigInt(1000000) : undefined,
            weight: weight.trim() ? BigInt(parseInt(weight)) : undefined,
            picture: pictureBlob,
          };
        })
      );

      await addBulkSnakesMutation.mutateAsync(snakesToAdd);
      toast.success(`${snakesToAdd.length} snake(s) added successfully`);
      setSnakes([{ tempId: '1', name: '', idNumber: '', genes: '', sex: '', birthday: '', weight: '', pictureFile: null, picturePreview: null }]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add snakes');
      console.error('Error adding snakes:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Ball Pythons</DialogTitle>
          <DialogDescription>
            Add multiple ball pythons at once. Fill in the details for each snake.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {snakes.map((snake, index) => (
              <div
                key={snake.tempId}
                className="border border-border rounded-lg p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Snake #{index + 1}
                  </span>
                  {snakes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSnakeRow(snake.tempId)}
                      aria-label={`Remove snake ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${snake.tempId}`}>Name *</Label>
                    <Input
                      id={`name-${snake.tempId}`}
                      placeholder="e.g., Monty"
                      value={snake.name}
                      onChange={(e) => updateSnake(snake.tempId, 'name', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`idNumber-${snake.tempId}`}>ID Number *</Label>
                    <Input
                      id={`idNumber-${snake.tempId}`}
                      placeholder="e.g., BP-001"
                      value={snake.idNumber}
                      onChange={(e) => updateSnake(snake.tempId, 'idNumber', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`genes-${snake.tempId}`}>Genes *</Label>
                    <Input
                      id={`genes-${snake.tempId}`}
                      placeholder="e.g., Pastel Mojave"
                      value={snake.genes}
                      onChange={(e) => updateSnake(snake.tempId, 'genes', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`sex-${snake.tempId}`}>Sex *</Label>
                    <Select
                      value={snake.sex}
                      onValueChange={(value) => updateSnake(snake.tempId, 'sex', value)}
                    >
                      <SelectTrigger id={`sex-${snake.tempId}`} className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`birthday-${snake.tempId}`}>Birthday</Label>
                    <Input
                      id={`birthday-${snake.tempId}`}
                      type="date"
                      value={snake.birthday}
                      onChange={(e) => updateSnake(snake.tempId, 'birthday', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${snake.tempId}`}>Weight (g)</Label>
                    <Input
                      id={`weight-${snake.tempId}`}
                      type="number"
                      placeholder="e.g., 1500"
                      value={snake.weight}
                      onChange={(e) => updateSnake(snake.tempId, 'weight', e.target.value)}
                      min="0"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`picture-${snake.tempId}`}>Picture (optional)</Label>
                  {snake.picturePreview ? (
                    <div className="relative">
                      <img
                        src={snake.picturePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePicture(snake.tempId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id={`picture-${snake.tempId}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePictureChange(snake.tempId, e)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`picture-${snake.tempId}`)?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Picture
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSnakeRow} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Snake
            </Button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addBulkSnakesMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addBulkSnakesMutation.isPending}>
              {addBulkSnakesMutation.isPending
                ? 'Adding...'
                : `Add ${snakes.filter((s) => s.name && s.idNumber && s.genes && s.sex).length} Snake(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
