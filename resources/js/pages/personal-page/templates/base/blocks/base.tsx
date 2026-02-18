import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { CSSProperties } from 'react';

export function withLayout(config: ComponentConfig<any>): ComponentConfig<any> {
  return {
    ...config,
    resolveFields: (data, params) => {
      let resolvedFields = config.resolveFields
        ? config.resolveFields(data, params)
        : params.fields;
      resolvedFields = {
        ...resolvedFields,
        width: {
          type: 'select',
          label: 'Width',
          options: [
            { value: 'w-auto', label: 'Auto' },
            { value: 'w-full', label: 'Full Width' },
            { value: 'w-fit', label: 'Fit Content' },
            { value: 'w-min', label: 'Min Content' },
            { value: 'w-max', label: 'Max Content' },
            { value: 'w-1/2', label: '50%' },
            { value: 'w-1/3', label: '33%' },
            { value: 'w-2/3', label: '66%' },
            { value: 'w-1/4', label: '25%' },
            { value: 'w-3/4', label: '75%' },
          ],
        },
        height: {
          type: 'select',
          label: 'Height',
          options: [
            { value: 'h-auto', label: 'Auto' },
            { value: 'h-full', label: 'Full Height' },
            { value: 'h-fit', label: 'Fit Content' },
            { value: 'h-min', label: 'Min Content' },
            { value: 'h-max', label: 'Max Content' },
            { value: 'h-1/2', label: '50%' },
            { value: 'h-1/3', label: '33%' },
            { value: 'h-2/3', label: '66%' },
            { value: 'h-1/4', label: '25%' },
            { value: 'h-3/4', label: '75%' },
          ],
        },
      } as any;

      if (params.parent?.type === 'Grid') {
        resolvedFields = {
          ...resolvedFields,
          colSpan: {
            type: 'number',
            label: 'Column Span',
            min: 1,
            max: 12,
          },
          rowSpan: {
            type: 'number',
            label: 'Row Span',
            min: 1,
            max: 12,
          },
        };
      } else if (params.parent?.type === 'Flex') {
        resolvedFields = {
          ...resolvedFields,
          flexGrow: {
            type: 'number',
            label: 'Flex Grow',
            min: 0,
          },
          flexShrink: {
            type: 'number',
            label: 'Flex Shrink',
            min: 0,
          },
          flexBasis: {
            type: 'text',
            label: 'Flex Basis (e.g. 200px, 50%, auto)',
          },
          alignSelf: {
            type: 'select',
            label: 'Align Self',
            options: [
              { label: 'Auto', value: 'auto' },
              { label: 'Start', value: 'flex-start' },
              { label: 'Center', value: 'center' },
              { label: 'End', value: 'flex-end' },
              { label: 'Stretch', value: 'stretch' },
              { label: 'Baseline', value: 'baseline' },
            ],
          },
          order: {
            type: 'number',
            label: 'Order',
          },
        };
      }

      return resolvedFields;
    },
    defaultProps: {
      ...config.defaultProps,
      // Size
      width: 'w-auto',
      height: 'h-auto',

      // Grid defaults
      colSpan: 1,
      rowSpan: 1,

      // Flex item defaults
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: 'auto',
      alignSelf: 'auto',
      order: 0,
    },
    inline: true,
    render: (props) => {
      const extraClasses = [];
      const extraStyles: CSSProperties = {};

      // Width / Height utility classes
      if (props.width) extraClasses.push(props.width);
      if (props.height) extraClasses.push(props.height);

      // -----------------
      // GRID SUPPORT
      // -----------------
      if (props?.colSpan) {
        extraStyles.gridColumn = `span ${Math.max(
          Math.min(props.colSpan, 12),
          1,
        )}`;
      }

      if (props?.rowSpan) {
        extraStyles.gridRow = `span ${Math.max(
          Math.min(props.rowSpan, 12),
          1,
        )}`;
      }

      // -----------------
      // FLEX ITEM SUPPORT
      // -----------------
      if (typeof props.flexGrow === 'number') {
        extraStyles.flexGrow = props.flexGrow;
      }

      if (typeof props.flexShrink === 'number') {
        extraStyles.flexShrink = props.flexShrink;
      }

      if (props.flexBasis) {
        extraStyles.flexBasis = props.flexBasis;
      }

      if (props.alignSelf) {
        extraStyles.alignSelf = props.alignSelf;
      }

      if (typeof props.order === 'number') {
        extraStyles.order = props.order;
      }

      return (
        <div
          ref={props.puck.dragRef}
          className={cn(props.className, extraClasses.join(' '))}
          style={{
            ...extraStyles,
            ...props.style,
          }}
        >
          {config.render(props)}
        </div>
      );
    },
    // render: (props) => {
    //   const element = config.render(props);
    //   const extraClasses = [];
    //   if (props.width) {
    //     extraClasses.push(props.width);
    //   }
    //   if (props.height) {
    //     extraClasses.push(props.height);
    //   }
    //   if (props.colSpan) {
    //     extraClasses.push(`col-span-${props.colSpan}`);
    //   }
    //   if (props.rowSpan) {
    //     extraClasses.push(`row-span-${props.rowSpan}`);
    //   }
    //   return cloneElement(element, {
    //     className:
    //       `${element.props.className || ''} ${extraClasses.join(' ')}`.trim(),
    //   });
    // },
  };
}
