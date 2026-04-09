import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head } from '@inertiajs/react';
import { LinkIcon, Users, Wallet } from 'lucide-react';

export default function DashboardIndex() {
  const { auth } = usePageSharedDataProps();
  const user = auth?.user;

  // Cek label role untuk ditampilkan di UI
  const roles = (user?.roles as any[]) || [];
  const isPartner = roles.some((r) => r.name === 'partner');
  const isMaster = roles.some((r) => r.name === 'master_affiliate');
  const roleLabel = isPartner
    ? 'Partner'
    : isMaster
      ? 'Master Affiliate'
      : 'Affiliate Standar';

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Mitra', url: '/affiliate/dashboard' },
        { title: 'Dashboard', url: '/affiliate/dashboard' },
      ]}
    >
      <Head title="Dashboard Mitra" />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Selamat datang, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Anda login sebagai{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {roleLabel}
            </span>
            .
          </p>
        </div>

        {/* --- STATISTIK SINGKAT (Placeholder) --- */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Potensi Komisi
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Menunggu validasi sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Agen Berlangganan
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dari link referal Anda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Link Subdomain Aktif
              </CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {user?.username}.travelboost.co.id
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gunakan link ini untuk promosi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AffiliateDashboardLayout>
  );
}
