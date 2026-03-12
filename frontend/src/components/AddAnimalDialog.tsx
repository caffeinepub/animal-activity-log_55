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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { useAddAnimal } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';

interface AddAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAnimalDialog({ open, onOpenChange }: AddAnimalDialogProps) {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [genes, setGenes] = useState('');
  const [sex, setSex] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const addAnimalMutation = useAddAnimal();

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      setPictureFile(file);
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
      }

      await addAnimalMutation.mutateAsync({
        name: name.trim(),
        genes: genes.trim(),
        sex,
        birthday: birthdayTimestamp,
        weight: weightValue,
        picture: pictureBlob,
        idNumber: idNumber.trim(),
      });
      toast.success('Animal added successfully');
      setName('');
      setIdNumber('');
      setGenes('');
      setSex('');
      setBirthday('');
      setWeight('');
      setPictureFile(null);
      setPicturePreview(null);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add animal');
      console.error('Error adding animal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Ball Python</DialogTitle>
          <DialogDescription>
            Enter the details of your ball python to start tracking meals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monty"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number *</Label>
              <Input
                id="idNumber"
                placeholder="e.g., BP-001"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genes">Genes *</Label>
              <Input
                id="genes"
                placeholder="e.g., Pastel Mojave"
                value={genes}
                onChange={(e) => setGenes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="sex">
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
              <Label htmlFor="birthday">Birthday (optional)</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight in grams (optional)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="e.g., 1500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="picture">Picture (optional)</Label>
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
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('picture')?.click()}
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
              disabled={addAnimalMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addAnimalMutation.isPending}>
              {addAnimalMutation.isPending ? 'Adding...' : 'Add Animal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
