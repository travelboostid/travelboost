import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { index, store } from '@/routes/admin/app-configs';
import { router, useForm } from '@inertiajs/react';
import Editor from '@monaco-editor/react';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CreateButton() {
  const [open, setOpen] = useState(false);
  const form = useForm({
    key: '',
    description: '',
    value: '',
  });

  const handleSubmit = () => {
    form.post(store().url, {
      onSuccess: () => {
        router.push(index());
        form.reset();
      },
    });
  };

  useEffect(() => {
    if (!open) return;
    form.reset();
  }, [form, open]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default">
          <PlusIcon />
          Create App Config
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form className="space-y-8">
          <Field>
            <FieldLabel htmlFor="key">Key</FieldLabel>
            <Input
              id="key"
              placeholder="key"
              value={form.data.key}
              onChange={(e) => form.setData('key', e.target.value)}
            />
            <FieldError>{form.errors.key}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input
              id="description"
              placeholder="Description"
              value={form.data.description}
              onChange={(e) => form.setData('description', e.target.value)}
            />
            <FieldError>{form.errors.description}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="value">Initial Value</FieldLabel>
            <Editor
              height="400px"
              theme="vs-dark"
              defaultLanguage="json"
              defaultValue={form.data.value}
              onChange={(v) => form.setData('value', v || '')}
            />
            <FieldError>{form.errors.value}</FieldError>
          </Field>
        </form>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={form.processing}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={form.processing}
          >
            Save
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
