import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RJSFSchema } from '@rjsf/utils';
import { Braces, FormInput } from 'lucide-react';
import { useState } from 'react';
import { AppConfigJsonEditor } from './app-config-json-editor';
import { AppConfigSchemaForm, hasJsonSchema } from './app-config-schema-form';

export type AppConfigEditMode = 'form' | 'json';

type Props = {
    schema?: RJSFSchema | Record<string, unknown> | null;
    value: Record<string, unknown> | null | undefined;
    onChange: (value: Record<string, unknown>) => void;
    mode?: AppConfigEditMode;
    onModeChange?: (mode: AppConfigEditMode) => void;
};

export function AppConfigValueEditor({
    schema,
    value,
    onChange,
    mode: controlledMode,
    onModeChange,
}: Props) {
    const schemaAvailable = hasJsonSchema(schema);
    const [internalMode, setInternalMode] = useState<AppConfigEditMode>(
        schemaAvailable ? 'form' : 'json',
    );
    const [jsonValue, setJsonValue] = useState(() =>
        JSON.stringify(value ?? {}, null, 2),
    );

    const mode = controlledMode ?? internalMode;

    const setMode = (nextMode: AppConfigEditMode) => {
        if (controlledMode === undefined) {
            setInternalMode(nextMode);
        }

        onModeChange?.(nextMode);
    };

    const switchToJson = () => {
        if (mode === 'form') {
            setJsonValue(JSON.stringify(value ?? {}, null, 2));
        }

        setMode('json');
    };

    const switchToForm = () => {
        if (mode === 'json') {
            try {
                const parsed = JSON.parse(jsonValue || '{}') as Record<
                    string,
                    unknown
                >;
                onChange(parsed);
            } catch {
                return;
            }
        }

        setMode('form');
    };

    const handleJsonChange = (nextJson: string) => {
        setJsonValue(nextJson);

        try {
            onChange(JSON.parse(nextJson || '{}') as Record<string, unknown>);
        } catch {
            // Keep typed JSON until it parses; submit handler can validate.
        }
    };

    if (!schemaAvailable) {
        return (
            <AppConfigJsonEditor
                value={jsonValue}
                onChange={handleJsonChange}
                height="280px"
            />
        );
    }

    return (
        <Tabs
            value={mode}
            onValueChange={(nextMode) => {
                if (nextMode === 'json') {
                    switchToJson();
                    return;
                }

                switchToForm();
            }}
            className="gap-4"
        >
            <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="form" className="gap-1.5">
                    <FormInput className="size-3.5" />
                    Form
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-1.5">
                    <Braces className="size-3.5" />
                    JSON
                </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="mt-0">
                <div className="rounded-lg border bg-background p-4">
                    <AppConfigSchemaForm
                        schema={schema as RJSFSchema}
                        value={(value ?? {}) as Record<string, unknown>}
                        onChange={onChange}
                    />
                </div>
            </TabsContent>

            <TabsContent value="json" className="mt-0">
                <AppConfigJsonEditor
                    value={jsonValue}
                    onChange={handleJsonChange}
                    height="280px"
                />
            </TabsContent>
        </Tabs>
    );
}
