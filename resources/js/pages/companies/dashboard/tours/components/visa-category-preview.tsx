type VisaCategoryItem = {
    id?: number;
    description: string;
    price: number | string;
    is_taxable: boolean;
};

type VisaCategory = {
    id: number;
    name: string;
    items: VisaCategoryItem[];
};

type Props = {
    category?: VisaCategory | null;
};

const currencyFormatter = new Intl.NumberFormat('id-ID');

export default function VisaCategoryPreview({ category }: Props) {
    if (!category || category.items.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Visa List
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {category.items.map((item, index) => (
                    <div
                        key={item.id ?? `${category.id}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-3"
                    >
                        <span className="truncate">{item.description}</span>
                        <span className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                            Rp{' '}
                            {currencyFormatter.format(Number(item.price || 0))}
                        </span>
                        <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {item.is_taxable ? 'Taxable' : 'Non-tax'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
