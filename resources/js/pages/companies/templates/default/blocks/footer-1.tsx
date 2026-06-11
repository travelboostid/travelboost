import type { ComponentConfig } from '@puckeditor/core';

export type Footer1ComponentProps = {
    content: string;
};

export const Footer1ComponentConfig: ComponentConfig<Footer1ComponentProps> = {
    label: 'Simple Bar',
    fields: {
        content: {
            label: 'Copyright Text',
            type: 'text',
            contentEditable: true,
        },
    },
    defaultProps: {
        content: '© 2025 Travel Company. All rights reserved.',
    },
    render: ({ content }) => (
        <footer className="bg-foreground px-4 py-10 text-center text-sm text-primary-foreground sm:px-6 lg:px-8">
            <p>{content}</p>
        </footer>
    ),
};
