import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { Braces, ChevronDown } from 'lucide-react';
import { AppConfigJsonEditor } from './app-config-json-editor';
import { hasJsonSchema } from './app-config-schema-form';
import { JsonSchemaDocsLink } from './json-schema-docs-link';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onChange: (value: string) => void;
    error?: string;
};

function schemaStatus(value: string): 'valid' | 'invalid' | 'empty' {
    if (!value.trim()) {
        return 'empty';
    }

    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;

        return hasJsonSchema(parsed) ? 'valid' : 'invalid';
    } catch {
        return 'invalid';
    }
}

export function AppConfigSchemaSection({
    open,
    onOpenChange,
    value,
    onChange,
    error,
}: Props) {
    const status = schemaStatus(value);

    return (
        <Collapsible open={open} onOpenChange={onOpenChange}>
            <div className="rounded-lg border bg-muted/20">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                <Braces className="size-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium">
                                        JSON Schema
                                    </span>
                                    <Badge
                                        variant={
                                            status === 'valid'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        className={cn(
                                            'text-[10px] font-normal',
                                            status === 'invalid' &&
                                                'text-destructive',
                                        )}
                                    >
                                        {status === 'valid'
                                            ? 'Form enabled'
                                            : status === 'invalid'
                                              ? 'Invalid JSON'
                                              : 'Empty'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Defines generated form fields. Changes apply
                                    live when JSON is valid.
                                </p>
                            </div>
                        </div>
                        <ChevronDown
                            className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform',
                                open && 'rotate-180',
                            )}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 border-t px-4 py-4">
                    <JsonSchemaDocsLink />
                    <AppConfigJsonEditor
                        value={value}
                        onChange={onChange}
                        height="240px"
                    />
                    {error ? (
                        <FieldError className="mt-2">{error}</FieldError>
                    ) : null}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
