import { useState } from 'react';

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
        <div key={permission.id} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`permission-${permission.id}`}
            checked={internalValue[permission.name] || false}
            onChange={(e) =>
              handleChange({ [permission.name]: e.target.checked })
            }
            disabled={disabled}
          />
          <label htmlFor={`permission-${permission.id}`}>
            {permission.name}
          </label>
        </div>
      ))}
    </div>
  );
}
