import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

export default function PermissionsSelector({
  permissions,
  value,
  defaultValue,
  onChange,
  disabled,
}: {
  permissions: any[];
  value?: Record<string, boolean>;
  defaultValue?: Record<string, boolean>;
  onChange?: (value: Record<string, boolean>) => void;
  disabled?: boolean;
}) {
  const [internalValue, setInternalValue] = useState<Record<string, boolean>>(
    value || defaultValue || {},
  );
  const handleChange = (v: Record<string, boolean>) => {
    const newValue = { ...internalValue, ...v };
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {permissions.map((permission) => (
        <Field
          orientation="horizontal"
          key={permission.id}
          className="flex items-center gap-2"
        >
          <Checkbox
            id={`permission-${permission.id}`}
            name={`permission-${permission.id}`}
            checked={internalValue[permission.name] || false}
            onCheckedChange={(checked) =>
              handleChange({ [permission.name]: Boolean(checked) })
            }
            disabled={disabled}
          />
          <FieldContent>
            <FieldLabel htmlFor="terms-checkbox-2">
              {permission.name}
            </FieldLabel>
            <FieldDescription className="text-xs">
              {permission.description || 'No description provided.'}
            </FieldDescription>
          </FieldContent>
        </Field>
      ))}
    </div>
  );
}
