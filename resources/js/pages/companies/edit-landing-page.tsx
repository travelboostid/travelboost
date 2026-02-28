import { useCompanyUpdateSettings } from '@/api/company/company';
import type { Data } from '@puckeditor/core';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BasePuckProps } from './templates/base/base.puck.config';
import DefaultThemePuckConfig from './templates/default/default.puck.config';
import SelectTemplate from './templates/select-template';

type Props = {
  company: any;
};

export default function PageDesigner({ company }: Props) {
  const [data, setData] = useState(
    company.settings.landing_page_data
      ? JSON.parse(company.settings.landing_page_data)
      : null,
  );
  const updater = useCompanyUpdateSettings();

  const handlePublish = (data: Data<BasePuckProps, any>) => {
    updater.mutate(
      {
        company: company.id,
        data: {
          landing_page_data: JSON.stringify(data),
        },
      },
      {
        onSuccess: () => {
          toast.success('Success', {
            position: 'top-center',
            description: 'Your changes have been saved.',
          });
        },
      },
    );
  };

  if (!data) {
    return <SelectTemplate onSelected={setData} />;
  }
  return (
    <ThemeProvider
      forcedTheme="light"
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Puck
        config={DefaultThemePuckConfig}
        data={data}
        onChange={setData}
        onPublish={handlePublish as any}
      />
    </ThemeProvider>
  );
}
