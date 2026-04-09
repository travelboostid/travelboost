import { Render } from '@puckeditor/core';
import DefaultThemePuckConfig from './templates/default/default.puck.config';
import { ensureAboutUsBlock } from './templates/default/utils';

type Props = {
  company: any;
};

export default function Page({ company }: Props) {
  const rawData = JSON.parse(company.settings.landing_page_data || '{}');
  const templatedData = ensureAboutUsBlock(rawData);

  return <Render config={DefaultThemePuckConfig} data={templatedData} />;
}
