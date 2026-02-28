import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/CategoryController';
import type { TourCategoryResource } from '@/api/model';
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
import { useState } from 'react';

type UpdateCategoryDialogProps = {
  category: TourCategoryResource;
  children: ReactNode;
};

export default function UpdateCategoryDialog({
  category,
  children,
}: UpdateCategoryDialogProps) {
  const { company } = usePageSharedDataProps();
  const [open, setOpen] = useState(false);

  const form = useForm({
    name: category.name,
    description: category.description,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    form.put(update({ company: company.username, category: category.id }).url, {
      preserveScroll: true,
      onError: () => setOpen(true), // 🔥 keep modal open on validation error
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Update Category</DialogTitle>
        </DialogHeader>

        {/* ❗ ONLY ONE submit button, ONLY ONE form */}
        <form onSubmit={handleSubmit} className="grid gap-6">
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
          <div className="grid gap-2">
            <Label htmlFor="description">Category Description</Label>
            <Input
              id="description"
              value={form.data.description || ''}
              onChange={(e) => form.setData('description', e.target.value)}
              placeholder="Category Description"
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
