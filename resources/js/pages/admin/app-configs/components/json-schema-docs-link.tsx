import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

type Props = {
    className?: string;
};

export function JsonSchemaDocsLink({ className }: Props) {
    return (
        <p
            className={cn(
                'text-xs text-muted-foreground [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1',
                className,
            )}
        >
            Reference the{' '}
            <a
                href="https://json-schema.org/specification"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
                JSON Schema specification
                <ExternalLink className="size-3 shrink-0" />
            </a>{' '}
            for syntax and supported keywords.
        </p>
    );
}
