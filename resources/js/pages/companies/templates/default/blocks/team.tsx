import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type TeamMember = {
    name: string;
    role: string;
    bio: string;
    avatar: string;
};

export type TeamComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    columns: 2 | 3 | 4;
    members: TeamMember[];
};

export const TeamComponentConfig: ComponentConfig<TeamComponentProps> = {
    label: 'Team Grid',
    fields: {
        ...contentHeaderFields(),
        ...contentStyleFields,
        columns: {
            type: 'select',
            label: 'Columns',
            options: [
                { value: 2, label: '2 Columns' },
                { value: 3, label: '3 Columns' },
                { value: 4, label: '4 Columns' },
            ],
        },
        members: {
            type: 'array',
            label: 'Team Members',
            max: 8,
            arrayFields: {
                name: { type: 'text', label: 'Name', contentEditable: true },
                role: { type: 'text', label: 'Role', contentEditable: true },
                bio: { type: 'textarea', label: 'Bio', contentEditable: true },
                avatar: imageField('Photo'),
            },
            getItemSummary: (item) => item.name || 'Member',
        },
    } as ComponentConfig<TeamComponentProps>['fields'],
    defaultProps: {
        badge: 'Our Team',
        header: 'Meet the People Behind Your Journey',
        description:
            'Passionate travel experts dedicated to making your trip extraordinary',
        ...contentStyleDefaults,
        background: 'muted',
        columns: 3,
        members: [
            {
                name: 'Sarah Chen',
                role: 'Head of Travel Design',
                bio: '15 years crafting bespoke itineraries across Asia and Europe.',
                avatar: '',
            },
            {
                name: 'Marco Rossi',
                role: 'Adventure Specialist',
                bio: 'Former mountain guide with expertise in off-the-beaten-path destinations.',
                avatar: '',
            },
            {
                name: 'Aisha Patel',
                role: 'Customer Experience Lead',
                bio: 'Ensures every traveler feels supported from booking to return.',
                avatar: '',
            },
        ],
    },
    render: ({
        badge,
        header,
        description,
        columns,
        members,
        padding,
        align,
        background,
        maxWidth,
    }) => (
        <ContentSection
            badge={badge}
            header={header}
            description={description}
            align={align}
            padding={padding}
            background={background}
            maxWidth={maxWidth}
        >
            <div
                className={cn(
                    'grid gap-6',
                    columns === 2 && 'sm:grid-cols-2',
                    columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
                    columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
                )}
            >
                {members.map((member, i) => (
                    <Card
                        key={i}
                        className="border-border/60 p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
                    >
                        <Avatar className="mx-auto size-24">
                            <AvatarImage
                                src={member.avatar}
                                alt={member.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                                {member.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">
                            {member.name}
                        </h3>
                        <p className="text-sm font-medium text-primary">
                            {member.role}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {member.bio}
                        </p>
                    </Card>
                ))}
            </div>
        </ContentSection>
    ),
};
