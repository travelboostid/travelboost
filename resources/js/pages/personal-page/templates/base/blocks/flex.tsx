import type { ComponentConfig, Slot } from '@puckeditor/core';

export type FlexComponentProps = {
  columns?: number;
  gap?: number;
  flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justifyContent:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
  content: Slot;
};

export const FlexComponentConfig: ComponentConfig<FlexComponentProps> = {
  fields: {
    columns: { type: 'number', label: 'Columns (optional)' },
    gap: { type: 'number', label: 'Gap (px)' },
    flexDirection: {
      type: 'select',
      label: 'Flex Direction',
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Row Reverse', value: 'row-reverse' },
        { label: 'Column', value: 'column' },
        { label: 'Column Reverse', value: 'column-reverse' },
      ],
    },
    justifyContent: {
      type: 'select',
      label: 'Justify Content',
      options: [
        { label: 'Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'flex-end' },
        { label: 'Space Between', value: 'space-between' },
        { label: 'Space Around', value: 'space-around' },
        { label: 'Space Evenly', value: 'space-evenly' },
      ],
    },
    alignItems: {
      type: 'select',
      label: 'Align Items',
      options: [
        { label: 'Stretch', value: 'stretch' },
        { label: 'Start', value: 'flex-start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'flex-end' },
        { label: 'Baseline', value: 'baseline' },
      ],
    },
    content: { type: 'slot' },
  },

  defaultProps: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 16,
    content: [],
  },

  render: ({
    gap = 16,
    flexDirection,
    justifyContent,
    alignItems,
    content: Content,
  }) => (
    <div
      style={{
        display: 'flex',
        flexDirection,
        justifyContent,
        alignItems,
        gap,
      }}
    >
      <Content
        style={{
          display: 'flex',
          flexDirection,
          justifyContent,
          alignItems,
          gap,
        }}
      />
    </div>
  ),
};
