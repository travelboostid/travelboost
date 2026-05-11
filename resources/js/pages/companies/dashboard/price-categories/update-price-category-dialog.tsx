import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/PriceCategoryController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type PriceCategory = {
  id: number;
  name: string;
  room_type: string;
  description?: string;
};

type UpdatePriceCategoryDialogProps = {
  item: PriceCategory;
  children: ReactNode;
};

export default function UpdatePriceCategoryDialog({
  item,
  children,
}: UpdatePriceCategoryDialogProps) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);

  const form = useForm({
    name: item?.name,
    room_type: item?.room_type,
    description: item?.description || '',
  });

  useEffect(() => {
    form.setData('name', item?.name);
    form.setData('room_type', item?.room_type);
    form.setData('description', item?.description || '');
  }, [item]);

  const ROOM_TYPES = [
    'Adult Single',
    'Adult Double',
    'Adult Twin',
    'Adult Triple',
    'Adult Quad',
    'Adult Extra Bed',
    'Child With Extra Bed',
    'Child No Bed',
    'Infant',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.put(
      update({
        company: company.username,
        price_category: item.id,
      }).url,
      {
        preserveScroll: true,
        preserveState: false,
        onError: () => setOpen(true),
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Price Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* NAME */}
          <div className="grid gap-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
              placeholder="Category name"
            />
            <InputError message={form.errors.name} />
          </div>

          {/* ROOM TYPE */}
          <div className="grid gap-2">
            <Label htmlFor="room_type">Room Type</Label>

            <select
              id="room_type"
              value={form.data.room_type || ''}
              onChange={(e) => form.setData('room_type', e.target.value)}
              className="border rounded-md h-9 px-3 text-sm"
            >
              <option value="">Select Room Type</option>

              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <InputError message={form.errors.room_type} />
          </div>

          {/* DESCRIPTION */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.data.description}
              onChange={(e) => form.setData('description', e.target.value)}
              placeholder="Description"
            />
            <InputError message={form.errors.description} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit" disabled={form.processing}>
              {form.processing && <Spinner className="mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
