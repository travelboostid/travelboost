import { Input } from '@/components/ui/input'; // Your shadcn Input component
import { Label } from '@/components/ui/label'; // Optional: for labels
import type { ComponentConfig } from '@puckeditor/core';
import { Fragment } from 'react/jsx-runtime';

export type InputComponentProps = {
  placeholder?: string;
  value?: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function ShadcnInput({
  placeholder = '',
  value = '',
  label = '',
  type = 'text',
  disabled = false,
  required = false,
  className = '',
}: InputComponentProps) {
  return (
    <Fragment>
      {label && (
        <Label htmlFor="input-field" className="mb-2 block">
          {label}
        </Label>
      )}
      <Input
        id="input-field"
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        required={required}
        className={className}
      />
    </Fragment>
  );
}

export const InputComponentConfig: ComponentConfig<InputComponentProps> = {
  fields: {
    placeholder: {
      type: 'text',
      label: 'Placeholder',
    },
    value: {
      type: 'text',
      label: 'Value',
    },
    label: {
      type: 'text',
      label: 'Label',
    },
    type: {
      type: 'select',
      label: 'Input Type',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'password', label: 'Password' },
        { value: 'number', label: 'Number' },
        { value: 'tel', label: 'Telephone' },
        { value: 'url', label: 'URL' },
      ],
    },
    disabled: {
      type: 'select',
      label: 'Disabled',
      options: [
        { value: 'false', label: 'No' },
        { value: 'true', label: 'Yes' },
      ],
    },
    required: {
      type: 'select',
      label: 'Required',
      options: [
        { value: 'false', label: 'No' },
        { value: 'true', label: 'Yes' },
      ],
    },
    className: {
      type: 'text',
      label: 'CSS Classes',
    },
  },
  render: ({ ...props }) => <ShadcnInput {...props} />,
  defaultProps: {
    placeholder: 'Enter text...',
    value: '',
    label: '',
    type: 'text',
    disabled: false,
    required: false,
    className: '',
  },
};
