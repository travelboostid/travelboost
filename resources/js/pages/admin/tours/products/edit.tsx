import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { products } from '@/routes/admin/tours';
import { Head } from '@inertiajs/react';
import { TourProductEditForm } from './components/tour-product-edit-form';

type EditTourProductPageProps = {
    tour: any;
    priceCategories: Array<{ id: number; name: string }>;
    productCommissionCategories: Array<{
        id: number;
        category_name: string;
    }>;
    currencies: Array<{ code: string; name: string }>;
};

export default function EditTourProductPage({
    tour,
    priceCategories,
    productCommissionCategories,
    currencies,
}: EditTourProductPageProps) {
    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['tours', 'tours.products']}
            openMenuIds={['tours']}
            breadcrumb={[
                { title: 'Tours' },
                { title: 'Products', url: products().url },
                { title: tour.name || tour.code },
            ]}
        >
            <Head title={`Edit ${tour.name || tour.code}`} />
            <TourProductEditForm
                tour={tour}
                priceCategories={priceCategories}
                productCommissionCategories={productCommissionCategories}
                currencies={currencies}
            />
        </AdminDashboardLayout>
    );
}
