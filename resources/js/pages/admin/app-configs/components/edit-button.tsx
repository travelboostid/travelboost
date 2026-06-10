import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { index, update } from '@/routes/admin/app-configs';
import { router, useForm } from '@inertiajs/react';
import { PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppConfigDialogShell } from './app-config-dialog-shell';
import { AppConfigFormSection } from './app-config-form-section';
import { hasJsonSchema } from './app-config-schema-form';
import { AppConfigSchemaSection } from './app-config-schema-section';
import {
    AppConfigValueEditor,
    type AppConfigEditMode,
} from './app-config-value-editor';

type AppConfigRow = {
    id: number;
    key: string;
    description: string | null;
    schema?: Record<string, unknown> | null;
    value?: Record<string, unknown> | null;
};

function stringifySchema(schema: Record<string, unknown> | null | undefined) {
    return JSON.stringify(schema ?? {}, null, 2);
}

export default function EditButton({ data }: { data: AppConfigRow }) {
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState<AppConfigEditMode>('form');
    const [schemaOpen, setSchemaOpen] = useState(false);
    const [schemaJson, setSchemaJson] = useState(stringifySchema(data.schema));
    const [activeSchema, setActiveSchema] = useState(data.schema ?? null);
    const [schemaRevision, setSchemaRevision] = useState(0);
    const [configValue, setConfigValue] = useState<Record<string, unknown>>(
        data.value ?? {},
    );

    const form = useForm({
        description: data.description ?? '',
    });

    const schemaAvailable = hasJsonSchema(activeSchema);

    const handleSchemaChange = (nextSchemaJson: string) => {
        setSchemaJson(nextSchemaJson);

        try {
            const parsed = JSON.parse(nextSchemaJson) as Record<
                string,
                unknown
            >;

            if (hasJsonSchema(parsed)) {
                setActiveSchema(parsed);
                setSchemaRevision((current) => current + 1);
            }
        } catch {
            // Wait for valid JSON before refreshing the generated form.
        }
    };

    const handleSubmit = () => {
        let parsedSchema: Record<string, unknown> | null = null;

        try {
            parsedSchema = schemaJson
                ? (JSON.parse(schemaJson) as Record<string, unknown>)
                : null;
        } catch {
            toast.error('Schema must be valid JSON');
            setSchemaOpen(true);
            return;
        }

        if (parsedSchema && !hasJsonSchema(parsedSchema)) {
            toast.error(
                'Schema must be a JSON Schema object with a type field',
            );
            setSchemaOpen(true);
            return;
        }

        form.transform(() => ({
            description: form.data.description,
            schema: parsedSchema,
            value: configValue,
        }));

        form.put(update({ app_config: data.id }).url, {
            onSuccess: () => {
                router.push(index());
            },
        });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setData({
            description: data.description ?? '',
        });
        setConfigValue(data.value ?? {});
        setSchemaJson(stringifySchema(data.schema));
        setActiveSchema(data.schema ?? null);
        setSchemaRevision((current) => current + 1);
        setSchemaOpen(false);
        setEditMode(hasJsonSchema(data.schema) ? 'form' : 'json');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <AppConfigDialogShell
            open={open}
            onOpenChange={setOpen}
            title="Edit app config"
            description="Update the description, schema, or stored value for this configuration."
            configKey={data.key}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            processing={form.processing}
            wide
            trigger={
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
                        <PencilIcon />
                    </Button>
                </DialogTrigger>
            }
        >
            <div className="space-y-6">
                <AppConfigFormSection
                    title="Description"
                    description="Human-readable summary shown in the admin table."
                >
                    <Field>
                        <FieldLabel htmlFor={`description-${data.id}`}>
                            Description
                        </FieldLabel>
                        <Textarea
                            id={`description-${data.id}`}
                            placeholder="What this config controls…"
                            rows={2}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.description}</FieldError>
                    </Field>
                </AppConfigFormSection>

                <Separator />

                <AppConfigSchemaSection
                    open={schemaOpen}
                    onOpenChange={setSchemaOpen}
                    value={schemaJson}
                    onChange={handleSchemaChange}
                    error={form.errors.schema}
                />

                <Separator />

                <AppConfigFormSection
                    title="Value"
                    description={
                        schemaAvailable
                            ? 'Edit fields with the generated form or switch to raw JSON.'
                            : 'No valid schema — edit the value as JSON, or fix the schema above.'
                    }
                >
                    <AppConfigValueEditor
                        key={`edit-${data.id}-${schemaRevision}`}
                        schema={activeSchema}
                        value={configValue}
                        mode={editMode}
                        onModeChange={setEditMode}
                        onChange={setConfigValue}
                    />
                    {!schemaAvailable ? (
                        <FieldDescription>
                            Expand JSON Schema and ensure it includes a{' '}
                            <code className="text-xs">type</code> field to
                            enable the form editor.
                        </FieldDescription>
                    ) : null}
                    <FieldError>{form.errors.value}</FieldError>
                </AppConfigFormSection>
            </div>
        </AppConfigDialogShell>
    );
}
