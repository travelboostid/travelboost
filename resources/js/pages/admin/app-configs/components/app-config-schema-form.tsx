import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import Form from '@rjsf/core';
import type {
    FieldTemplateProps,
    ObjectFieldTemplateProps,
    RJSFSchema,
    UiSchema,
    WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

function FieldTemplate({
    id,
    label,
    children,
    rawDescription,
    required,
    errors,
    rawErrors,
    displayLabel = true,
}: FieldTemplateProps) {
    return (
        <div className="space-y-2">
            {displayLabel && label ? (
                <Label htmlFor={id}>
                    {label}
                    {required ? (
                        <span className="text-destructive"> *</span>
                    ) : null}
                </Label>
            ) : null}
            {displayLabel && rawDescription ? (
                <p className="text-xs text-muted-foreground">
                    {rawDescription}
                </p>
            ) : null}
            {children}
            {rawErrors && rawErrors.length > 0 ? (
                <InputError message={rawErrors.join(', ')} />
            ) : (
                errors
            )}
        </div>
    );
}

function TextWidget({
    id,
    value,
    disabled,
    onChange,
    schema,
    placeholder,
}: WidgetProps) {
    const isNumber = schema.type === 'number' || schema.type === 'integer';

    return (
        <Input
            id={id}
            value={value ?? ''}
            disabled={disabled}
            placeholder={placeholder}
            type={isNumber ? 'number' : 'text'}
            min={isNumber ? schema.minimum : undefined}
            step={
                isNumber ? (schema.type === 'integer' ? 1 : 'any') : undefined
            }
            onChange={(event) => {
                if (!isNumber) {
                    onChange(event.target.value);
                    return;
                }

                onChange(
                    event.target.value === ''
                        ? undefined
                        : Number(event.target.value),
                );
            }}
        />
    );
}

function TextareaWidget({
    id,
    value,
    disabled,
    onChange,
    placeholder,
}: WidgetProps) {
    return (
        <Textarea
            id={id}
            value={value ?? ''}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            onChange={(event) => onChange(event.target.value)}
        />
    );
}

function ObjectFieldTemplate({
    title,
    description,
    properties,
}: ObjectFieldTemplateProps) {
    const hasHeader = Boolean(title || description);

    return (
        <div className="space-y-4">
            {hasHeader ? (
                <div className="space-y-1.5">
                    {title ? (
                        <h4 className="text-base font-semibold tracking-tight">
                            {title}
                        </h4>
                    ) : null}
                    {description ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                    <Separator className="mt-4!" />
                </div>
            ) : null}
            <div className="space-y-4">
                {properties.map((property) => (
                    <div key={property.name}>{property.content}</div>
                ))}
            </div>
        </div>
    );
}

const widgets = {
    TextWidget,
    TextareaWidget,
};

const templates = {
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: () => null,
    DescriptionFieldTemplate: () => null,
    ButtonTemplates: {
        SubmitButton: () => null,
    },
};

type Props = {
    schema: RJSFSchema;
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
    uiSchema?: UiSchema;
};

export function AppConfigSchemaForm({
    schema,
    value,
    onChange,
    uiSchema,
}: Props) {
    return (
        <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={value}
            validator={validator}
            widgets={widgets}
            templates={templates}
            liveValidate
            showErrorList={false}
            onChange={(event) => onChange(event.formData)}
        >
            <></>
        </Form>
    );
}

export function hasJsonSchema(
    schema: unknown,
): schema is Record<string, unknown> {
    return (
        !!schema &&
        typeof schema === 'object' &&
        !Array.isArray(schema) &&
        'type' in schema
    );
}
