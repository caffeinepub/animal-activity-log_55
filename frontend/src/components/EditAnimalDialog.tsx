import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { useEditAnimal } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import type { Animal } from '../backend';

interface EditAnimalDialogProps {
  animal: Animal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnimalDialog({ animal, open, onOpenChange }: EditAnimalDialogProps) {
  const [name, setName] = useState(animal.name);
  const [idNumber, setIdNumber] = useState(animal.idNumber);
  const [genes, setGenes] = useState(animal.genes);
  const [sex, setSex] = useState(animal.sex);
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [existingPicture, setExistingPicture] = useState<ExternalBlob | null>(null);
  const editAnimalMutation = useEditAnimal();

  useEffect(() => {
    if (open) {
      setName(animal.name);
      setIdNumber(animal.idNumber);
      setGenes(animal.genes);
      setSex(animal.sex);
      if (animal.birthday) {
        const date = new Date(Number(animal.birthday) / 1000000);
        setBirthday(date.toISOString().split('T')[0]);
      } else {
        setBirthday('');
      }
      if (animal.weight !== undefined && animal.weight !== null) {
        setWeight(animal.weight.toString());
      } else {
        setWeight('');
      }
      if (animal.picture) {
        setExistingPicture(animal.picture);
        setPicturePreview(animal.picture.getDirectURL());
      } else {
        setExistingPicture(null);
        setPicturePreview(null);
      }
      setPictureFile(null);
    }
  }, [open, animal]);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      setPictureFile(file);
      setExistingPicture(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setPictureFile(null);
    setPicturePreview(null);
    setExistingPicture(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !genes.trim() || !sex || !idNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const birthdayTimestamp = birthday
        ? BigInt(new Date(birthday).getTime()) * BigInt(1000000)
        : null;

      const weightValue = weight.trim() ? BigInt(parseInt(weight)) : null;

      let pictureBlob: ExternalBlob | null = null;
      if (pictureFile) {
        const arrayBuffer = await pictureFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        pictureBlob = ExternalBlob.fromBytes(uint8Array);
      } else if (existingPicture) {
        pictureBlob = existingPicture;
      }

      await editAnimalMutation.mutateAsync({
        id: animal.id,
        name: name.trim(),
        genes: genes.trim(),
        sex,
        birthday: birthdayTimestamp,
        weight: weightValue,
        picture: pictureBlob,
        idNumber: idNumber.trim(),
      });
      toast.success('Animal updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update animal');
      console.error('Error updating animal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {animal.name}</DialogTitle>
          <DialogDescription>
            Update the details of your ball python.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Monty"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-idNumber">ID Number *</Label>
              <Input
                id="edit-idNumber"
                placeholder="e.g., BP-001"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-genes">Genes *</Label>
              <Input
                id="edit-genes"
                placeholder="e.g., Pastel Mojave"
                value={genes}
                onChange={(e) => setGenes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sex">Sex *</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="edit-sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birthday">Birthday (optional)</Label>
              <Input
                id="edit-birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight in grams (optional)</Label>
              <Input
                id="edit-weight"
                type="number"
                placeholder="e.g., 1500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-picture">Picture (optional)</Label>
              {picturePreview ? (
                <div className="relative">
                  <img
                    src={picturePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemovePicture}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-picture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-picture')?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Picture
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum file size: 5MB
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={editAnimalMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editAnimalMutation.isPending}>
              {editAnimalMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
