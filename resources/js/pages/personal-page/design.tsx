import { useUpdateUserPreference } from '@/api/user-preference/user-preference';
import type { SharedData } from '@/types';
import { type User } from '@/types';
import { usePage } from '@inertiajs/react';
import type { Data } from '@puckeditor/core';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { ThemeProvider } from 'next-themes';
import type { BasePuckProps } from './templates/base/base.puck.config';
import { TEMPLATES } from './templates/templates';

type Props = {
  user: User & { preference: any };
};
export default function Page({ user }: Props) {
  const { auth } = usePage<SharedData>().props;
  const templatedId = user.preference
    .landing_page_template_id as keyof typeof TEMPLATES;
  const templatedData = user.preference.landing_page_template_data;
  const template = TEMPLATES[templatedId] || TEMPLATES.default;

  const updater = useUpdateUserPreference();

  const handlePublish = (data: Data<BasePuckProps, any>) => {
    updater.mutate({
      user: auth.user.id,
      data: {
        landing_page_template_data: JSON.stringify(data),
        landing_page_template_id: templatedId,
      },
    });
  };
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <Puck
        config={template.config}
        data={JSON.parse(templatedData || '{}')}
        onPublish={handlePublish as any}
      />
    </ThemeProvider>
  );
}
