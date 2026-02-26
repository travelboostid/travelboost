import type { User } from '@/api/model/user';
import { Render } from '@puckeditor/core';
import { TEMPLATES } from './templates/templates';

type Props = {
  user: User & { preference: any };
};
//25022026
/*export default function Page({ user }: Props) {
  const templatedId = user.preference
    .landing_page_template_id as keyof typeof TEMPLATES;
  const templatedData = user.preference.landing_page_template_data;
  const template = TEMPLATES[templatedId] || TEMPLATES.default;

  return (
    <Render config={template.config} data={JSON.parse(templatedData || '{}')} />
  );
}*/

export default function Page({ user }: Props) {
  const preference = user?.preference;

  if (!preference) {
    return <div>No template selected</div>;
  }

  const templatedId =
    preference.landing_page_template_id as keyof typeof TEMPLATES;

  const templatedData = preference.landing_page_template_data;

  const template = TEMPLATES[templatedId] || TEMPLATES.default;

  return (
    <Render
      config={template.config}
      data={JSON.parse(templatedData || "{}")}
    />
  );
}
