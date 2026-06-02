import { Input } from '@/components/ui/input'
import type { ChangeEventHandler } from 'react';
import { useMemo } from 'react'

const formatter = new Intl.NumberFormat('id-ID')

type Props = {
  value: string | number
  onChange: (raw: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
}

export default function MoneyInput({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  name,
}: Props) {
    const displayValue = useMemo(() => {
        const numeric =
            parseFloat(String(value ?? '0').replace(/,/g, '')) || 0;

        return formatter.format(numeric)
    }, [value])


  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawValue = e.target.value || ''
    onChange(rawValue.replace(/\D/g, ''))
  }

  return (
    <Input
      type="text"
      className={`no-spinner w-full ${className}`}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      name={name}
    />
  )
}