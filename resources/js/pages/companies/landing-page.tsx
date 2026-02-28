import { Render } from '@puckeditor/core';
import DefaultThemePuckConfig from './templates/default/default.puck.config';

type Props = {
  company: any;
};

export default function Page({ company }: Props) {
  const templatedData = JSON.parse(company.settings.landing_page_data || '{}');

  return <Render config={DefaultThemePuckConfig} data={templatedData} />;
}
