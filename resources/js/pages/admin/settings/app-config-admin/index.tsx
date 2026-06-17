import AdminLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

type ConfigItem = {
    key: string;
    value: string;
};

type PageProps = {
    config: Record<string, any>;
    flash?: {
        success?: string;
    };
};

export default function AppConfigPage() {
    const { props } = usePage<PageProps>();

    const [items, setItems] = useState<ConfigItem[]>(
        Object.entries(props.config || {}).map(([key, value]) => ({
            key,
            value: String(value ?? ''),
        })),
    );

    const { processing } = useForm({});

    const addRow = () => {
        setItems((prev) => [
            ...prev,
            {
                key: '',
                value: '',
            },
        ]);
    };

    const removeRow = (index: number) => {
        if (!confirm('Delete this parameter?')) {
            return;
        }
        const newItems = items.filter((_, i) => i !== index);

        setItems(newItems);

        const payload = newItems.reduce(
            (acc, item) => {
                if (item.key.trim()) {
                    acc[item.key.trim()] = item.value;
                }

                return acc;
            },
            {} as Record<string, string>,
        );

        router.put(window.location.pathname, payload, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const updateKey = (index: number, value: string) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          key: value,
                      }
                    : item,
            ),
        );
    };

    const updateValue = (index: number, value: string) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          value,
                      }
                    : item,
            ),
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = items.reduce(
            (acc, item) => {
                if (item.key.trim()) {
                    acc[item.key.trim()] = item.value;
                }

                return acc;
            },
            {} as Record<string, string>,
        );

        router.put(window.location.pathname, payload);
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    title: 'Settings',
                },
                {
                    title: 'Application Config',
                },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.app-config-admin']}
        >
            <Head title="Application Config" />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4">
                {/* Flash Message */}
                {props.flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {props.flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="font-semibold">
                                    Configuration Parameters
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Add, edit or remove configuration values.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addRow}
                                className="w-full sm:w-auto"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Parameter
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Key
                                            </th>

                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Value
                                            </th>

                                            <th className="w-24 px-4 py-3 text-center text-sm font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-4 py-8 text-center text-muted-foreground"
                                                >
                                                    No parameters found.
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t"
                                                >
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            placeholder="example_key"
                                                            value={item.key}
                                                            onChange={(e) =>
                                                                updateKey(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border px-3 py-2 text-sm"
                                                        />
                                                    </td>

                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            placeholder="value"
                                                            value={item.value}
                                                            onChange={(e) =>
                                                                updateValue(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border px-3 py-2 text-sm"
                                                        />
                                                    </td>

                                                    <td className="p-3 text-center">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-500"
                                                            onClick={() =>
                                                                removeRow(index)
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="space-y-3 p-4 md:hidden">
                                    {items.length === 0 ? (
                                        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
                                            No parameters found.
                                        </div>
                                    ) : (
                                        items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="rounded-xl border bg-background p-4 shadow-sm"
                                            >
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                            Key
                                                        </label>

                                                        <input
                                                            type="text"
                                                            placeholder="example_key"
                                                            value={item.key}
                                                            onChange={(e) =>
                                                                updateKey(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border px-3 py-2 text-sm"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                            Value
                                                        </label>

                                                        <input
                                                            type="text"
                                                            placeholder="value"
                                                            value={item.value}
                                                            onChange={(e) =>
                                                                updateValue(
                                                                    index,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border px-3 py-2 text-sm"
                                                        />
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeRow(index)
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            <Save className="mr-2 h-4 w-4" />

                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
