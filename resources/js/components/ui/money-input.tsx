import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

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
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const numeric = String(value ?? '')
    setDisplay(
      numeric === ''
        ? ''
        : new Intl.NumberFormat('id-ID').format(Number(numeric))
    )
  }, [value])

  const handleChange = (val: string) => {
    const raw = val.replace(/\D/g, '')

    setDisplay(
      raw === ''
        ? ''
        : new Intl.NumberFormat('id-ID').format(Number(raw))
    )

    onChange(raw)
  }

  return (
    <Input
      type="text"
      className={`no-spinner w-full ${className}`}
      placeholder={placeholder}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      name={name}
    />
  )
}