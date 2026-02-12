// lucide-map.ts
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> =
  LucideIcons as unknown as Record<string, LucideIcon>;

export const LUCIDE_ICON_NAMES = Object.keys(LUCIDE_ICON_MAP);

type LucideIconRendererProps = LucideIcons.LucideProps & { name: string };

export function LucideIconRenderer({
  name,
  ...props
}: LucideIconRendererProps) {
  const Icon = LUCIDE_ICON_MAP[name] ?? LucideIcons.Circle;

  return <Icon {...props} />;
}
