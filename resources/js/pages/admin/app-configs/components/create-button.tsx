import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { index, store } from '@/routes/admin/app-configs';
import { router, useForm } from '@inertiajs/react';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppConfigDialogShell } from './app-config-dialog-shell';
import { AppConfigFormSection } from './app-config-form-section';
import { AppConfigJsonEditor } from './app-config-json-editor';
import { hasJsonSchema } from './app-config-schema-form';
import {
    AppConfigValueEditor,
    type AppConfigEditMode,
} from './app-config-value-editor';
import { JsonSchemaDocsLink } from './json-schema-docs-link';

const DEFAULT_SCHEMA = '{\n  "type": "object",\n  "properties": {}\n}';

export default function CreateButton() {
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState<AppConfigEditMode>('json');
    const [activeSchema, setActiveSchema] = useState<Record<
        string,
        unknown
    > | null>({ type: 'object', properties: {} });
    const [schemaRevision, setSchemaRevision] = useState(0);
    const [configValue, setConfigValue] = useState<Record<string, unknown>>({});

    const form = useForm({
        key: '',
        description: '',
        schema: DEFAULT_SCHEMA,
        value: '{}',
    });

    const schemaAvailable = hasJsonSchema(activeSchema);

    const handleSchemaChange = (nextSchemaJson: string) => {
        form.setData('schema', nextSchemaJson);

        try {
            const parsed = JSON.parse(nextSchemaJson) as Record<
                string,
                unknown
            >;

            if (hasJsonSchema(parsed)) {
                setActiveSchema(parsed);
                setSchemaRevision((current) => current + 1);
                setEditMode('form');
            }
        } catch {
            // Wait for valid JSON before refreshing the generated form.
        }
    };

    const handleSubmit = () => {
        if (!form.data.key.trim()) {
            toast.error('Key is required');
            return;
        }

        let parsedSchema = null;

        try {
            parsedSchema = form.data.schema
                ? (JSON.parse(form.data.schema) as Record<string, unknown>)
                : null;
        } catch {
            toast.error('Schema must be valid JSON');
            return;
        }

        if (parsedSchema && !hasJsonSchema(parsedSchema)) {
            toast.error(
                'Schema must be a JSON Schema object with a type field',
            );
            return;
        }

        form.transform(() => ({
            key: form.data.key.trim(),
            description: form.data.description,
            schema: parsedSchema,
            value: configValue,
        }));

        form.post(store().url, {
            onSuccess: () => {
                router.push(index());
                form.reset();
                setConfigValue({});
                setActiveSchema({ type: 'object', properties: {} });
                setSchemaRevision((current) => current + 1);
                setEditMode('json');
            },
        });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        form.reset();
        form.setData('schema', DEFAULT_SCHEMA);
        setConfigValue({});
        setActiveSchema({ type: 'object', properties: {} });
        setSchemaRevision((current) => current + 1);
        setEditMode('json');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <AppConfigDialogShell
            open={open}
            onOpenChange={setOpen}
            title="Create app config"
            description="Define a unique key, optional JSON Schema for structured editing, and the initial value."
            onSubmit={handleSubmit}
            submitLabel="Create config"
            processing={form.processing}
            trigger={
                <DialogTrigger asChild>
                    <Button variant="default">
                        <PlusIcon />
                        Create App Config
                    </Button>
                </DialogTrigger>
            }
        >
            <div className="space-y-6">
                <AppConfigFormSection
                    step={1}
                    title="Identity"
                    description="The key is permanent and used across the application to load this config."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="key">Key</FieldLabel>
                            <Input
                                id="key"
                                placeholder="chatbot"
                                className="font-mono"
                                value={form.data.key}
                                onChange={(e) =>
                                    form.setData('key', e.target.value)
                                }
                                autoFocus
                            />
                            <FieldDescription>
                                Lowercase identifier, e.g. chatbot or admin.
                            </FieldDescription>
                            <FieldError>{form.errors.key}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="description">
                                Description
                            </FieldLabel>
                            <Textarea
                                id="description"
                                placeholder="What this config controls…"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <FieldError>{form.errors.description}</FieldError>
                        </Field>
                    </div>
                </AppConfigFormSection>

                <Separator />

                <AppConfigFormSection
                    step={2}
                    title="JSON Schema"
                    description="Optional but recommended. When valid, the value editor below can use a generated form."
                >
                    <JsonSchemaDocsLink />
                    <AppConfigJsonEditor
                        value={form.data.schema}
                        onChange={handleSchemaChange}
                        height="220px"
                    />
                    <FieldError>{form.errors.schema}</FieldError>
                </AppConfigFormSection>

                <Separator />

                <AppConfigFormSection
                    step={3}
                    title="Initial value"
                    description={
                        schemaAvailable
                            ? 'Set defaults using the generated form or raw JSON.'
                            : 'Provide a valid JSON object. Add a schema above to unlock the form editor.'
                    }
                >
                    <AppConfigValueEditor
                        key={`create-${schemaRevision}`}
                        schema={activeSchema}
                        value={configValue}
                        mode={editMode}
                        onModeChange={setEditMode}
                        onChange={setConfigValue}
                    />
                    <FieldError>{form.errors.value}</FieldError>
                </AppConfigFormSection>
            </div>
        </AppConfigDialogShell>
    );
}
