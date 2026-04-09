// lucide-map.ts
import type { Data } from '@puckeditor/core';
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

export function ensureAboutUsBlock(data: Data): Data {
  if (!data?.content?.length) {
    return data;
  }

  const hasAboutUs = data.content.some((block) => block.type === 'AboutUs');
  if (hasAboutUs) {
    return data;
  }

  const aboutUsBlock = {
    type: 'AboutUs' as const,
    props: {
      header: 'Tentang Kami',
      description:
        'Kenali lebih dekat agen perjalanan Anda dan hubungi kami kapan saja.',
      id: `AboutUs-${crypto.randomUUID()}`,
    },
  };

  const insertBeforeIndex = data.content.findIndex(
    (block) => block.type === 'Faq' || block.type === 'Footer1',
  );

  const newContent = [...data.content];
  if (insertBeforeIndex !== -1) {
    newContent.splice(insertBeforeIndex, 0, aboutUsBlock);
  } else {
    newContent.push(aboutUsBlock);
  }

  return { ...data, content: newContent };
}
