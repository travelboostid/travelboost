// lucide-map.tsx
import lucide from '@iconify-json/lucide/icons.json';
import type { IconProps } from '@iconify/react';
import { Icon } from '@iconify/react';
import type { Data } from '@puckeditor/core';

export const LUCIDE_ICON_NAMES = Object.keys(lucide.icons);

export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number];

type LucideIconRendererProps = Omit<IconProps, 'icon'> & {
    name: string;
};

export function LucideIconRenderer({
    name,
    ...props
}: LucideIconRendererProps) {
    const iconName = `lucide:${name}`;

    const exists = name in lucide.icons;

    return <Icon {...props} icon={exists ? iconName : 'lucide:circle'} />;
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
