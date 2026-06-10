import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { update } from '@/routes/admin/database/vendors';
import { Head } from '@inertiajs/react';
import { CompanyEditForm } from '../shared/company-edit-form';
import type { AdminCompanyRow } from '../shared/company-types';

type EditVendorPageProps = {
    company: AdminCompanyRow;
};

export default function EditVendorPage({ company }: EditVendorPageProps) {
    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.vendors']}
            openMenuIds={['database']}
            breadcrumb={[
                { title: 'Database' },
                { title: 'Vendor' },
                { title: company.name },
            ]}
        >
            <Head title={`Edit ${company.name}`} />

            <div className="mx-auto w-full max-w-4xl">
                <CompanyEditForm
                    company={company}
                    entityLabel="Vendor"
                    updateUrl={update({ vendor: company.id }).url}
                />
            </div>
        </AdminDashboardLayout>
    );
}
