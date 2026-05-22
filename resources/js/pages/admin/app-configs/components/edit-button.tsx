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
import { index, update } from '@/routes/admin/app-configs';
import { json } from '@codemirror/lang-json';
import { router, useForm } from '@inertiajs/react';
import CodeMirror from '@uiw/react-codemirror';
import { PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EditButton({ data }: { data: any }) {
    const [open, setOpen] = useState(false);

    const form = useForm({
        key: data.key,
        description: data.description,
        value: data.value ? JSON.stringify(data.value, null, 2) : '',
    });

    const handleSubmit = () => {
        form.transform((data) => ({
            ...data,
            value: data.value ? JSON.parse(data.value) : null,
        }));
        form.put(update(data.id).url, {
            onSuccess: () => {
                router.push(index());
            },
        });
    };

    useEffect(() => {
        if (!open) return;
        form.setData({
            key: data.key,
            description: data.description,
            value: data.value ? JSON.stringify(data.value, null, 2) : '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="outline">
                    <PencilIcon />
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
                            disabled
                        />
                        <FieldError>{form.errors.key}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="description">
                            Description
                        </FieldLabel>
                        <Input
                            id="description"
                            placeholder="Description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.description}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="value">Initial Value</FieldLabel>
                        <CodeMirror
                            value={form.data.value}
                            height="200px"
                            extensions={[json()]}
                            onChange={(val) => form.setData('value', val)}
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
