import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/admin/database/medias';
import { Head, useForm } from '@inertiajs/react';
import type { AdminMediaRow } from './components/media-row-actions';

type EditMediaPageProps = {
    media: AdminMediaRow;
};

export default function EditMediaPage({ media }: EditMediaPageProps) {
    const form = useForm({
        name: media.name || '',
        description: media.description || '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        form.put(update({ media: media.id }).url, {
            preserveScroll: true,
        });
    };

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.medias']}
            openMenuIds={['database']}
            breadcrumb={[
                { title: 'Database' },
                { title: 'Media' },
                { title: media.name || `#${media.id}` },
            ]}
        >
            <Head title={`Edit ${media.name || 'media'}`} />

            <div className="mx-auto w-full max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        {form.errors.name ? (
                            <p className="text-sm text-destructive">
                                {form.errors.name}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                        />
                        {form.errors.description ? (
                            <p className="text-sm text-destructive">
                                {form.errors.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>
        </AdminDashboardLayout>
    );
}
