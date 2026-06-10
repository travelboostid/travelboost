import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { update } from '@/routes/admin/database/agents';
import { Head } from '@inertiajs/react';
import { CompanyEditForm } from '../shared/company-edit-form';
import type { AdminCompanyRow } from '../shared/company-types';

type EditAgentPageProps = {
    company: AdminCompanyRow;
};

export default function EditAgentPage({ company }: EditAgentPageProps) {
    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.agents']}
            openMenuIds={['database']}
            breadcrumb={[
                { title: 'Database' },
                { title: 'Agent' },
                { title: company.name },
            ]}
        >
            <Head title={`Edit ${company.name}`} />

            <div className="mx-auto w-full max-w-4xl">
                <CompanyEditForm
                    company={company}
                    entityLabel="Agent"
                    updateUrl={update({ agent: company.id }).url}
                />
            </div>
        </AdminDashboardLayout>
    );
}
