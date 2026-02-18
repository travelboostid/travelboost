import type { ComponentConfig } from '@puckeditor/core';

export type Footer1ComponentProps = {
  content: string;
};

export const Footer1ComponentConfig: ComponentConfig<Footer1ComponentProps> = {
  label: 'Footer',
  fields: {
    content: { type: 'text', contentEditable: true },
  },
  defaultProps: {
    content: '© 2025 Travel Company. All rights reserved.',
  },
  render: ({ content }) => {
    return (
      <footer className="bg-foreground px-4 py-12 text-primary-foreground sm:px-6 lg:px-8  text-center text-sm">
        <p>{content}</p>
      </footer>
    );
  },
};
