import { formatIDR } from '@/lib/utils';
import { Medal } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function TopLists({ destinations, agents, type }: any) {
    const isVendor = type === 'vendor';
    const data = (isVendor ? agents : destinations).slice(0, 5);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Medal size={16} className="text-amber-500" />
                    <FormattedMessage defaultMessage="Performance Leaders" />
                </h4>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((item: any, i: number) => (
                    <div
                        key={i}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">
                                0{i + 1}
                            </span>
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {item.name}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {isVendor ? (
                                        <FormattedMessage
                                            defaultMessage="{count} Pax"
                                            values={{ count: item.pax }}
                                        />
                                    ) : (
                                        item.code
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-500">
                                {formatIDR(
                                    isVendor ? item.profit : item.commission,
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
