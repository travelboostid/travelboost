import type { ComponentConfig, Slot } from '@puckeditor/core';
import type { ReactNode } from 'react';

export type GridProps = {
  columns?: number;
  gap?: number;
  content: ReactNode;
};

export type GridComponentProps = {
  columns?: number;
  gap?: number;
  content: Slot;
};

export function Grid({ columns, gap, content }: GridProps) {
  return <div style={{ display: 'grid', columns, gap }}>{content}</div>;
}

export const GridComponentConfig: ComponentConfig<GridComponentProps> = {
  fields: {
    columns: { type: 'number' },
    gap: { type: 'number' },
    content: { type: 'slot' },
  },
  defaultProps: {
    columns: 1,
    gap: 16,
    content: [],
  },
  render: ({ columns = 1, gap, content: Content }) => (
    <div style={{ display: 'grid', columns, gap }}>
      <Content
        style={{
          // Use CSS grid in this slot
          display: 'grid',
          gridTemplateColumns: `repeat(${columns || 1}, 1fr)`,
          gap,
        }}
      />
    </div>
  ),
};
