import { Render } from '@puckeditor/core';
import simple from './templates/bootstraps/simple.json';
import DefaultThemePuckConfig from './templates/default/default.puck.config';
import { ensureAboutUsBlock } from './templates/default/utils';

type Props = {
    company: any;
};

export default function Page({ company }: Props) {
    const rawData = JSON.parse(company.settings?.landing_page_data || '{}');
    const hasLandingPageContent =
        Array.isArray(rawData?.content) && rawData.content.length > 0;
    const fallbackData = {
        ...simple,
        root: {
            ...simple.root,
            props: {
                ...simple.root.props,
                title: company.name,
            },
        },
    };
    const templatedData = ensureAboutUsBlock(
        hasLandingPageContent ? rawData : fallbackData,
    );

    return <Render config={DefaultThemePuckConfig} data={templatedData} />;
}
