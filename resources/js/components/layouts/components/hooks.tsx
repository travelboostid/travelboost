import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';

const COMPANY_TYPE_MAP = {
  vendor: 'Vendor',
  agent: 'Agent',
};

export type DashboardType = {
  id: string;
  title: string;
  subtitle: string;
  baseUrl: string;
  thumbnailUrl?: string;
};

export function useAvailableDashboards() {
  const { auth } = usePageSharedDataProps();

  const dashboards = [];

  if (auth.user) {
    dashboards.push({
      id: 'user:current',
      title: `${auth.user.name}'s Dashboard`,
      subtitle: 'User',
      baseUrl: '/me',
      thumbnailUrl: auth.user.photo_url || undefined,
    });
    auth.user.companies.forEach((company) => {
      dashboards.push({
        id: `company:${company.username}`,
        subtitle:
          COMPANY_TYPE_MAP[company.type as keyof typeof COMPANY_TYPE_MAP] ||
          'User',
        title: `${company.name} Dashboard`,
        baseUrl: `/companies/${company.username}/dashboard`,
        thumbnailUrl: company.photo_url || undefined,
      });
    });
    // must check role actually
    dashboards.push({
      id: 'admin:default',
      title: `Admin Dashboard`,
      subtitle: 'Admin',
      baseUrl: '/admin',
      thumbnailUrl: DEFAULT_PHOTO,
    });
  }
  return dashboards as DashboardType[];
}
