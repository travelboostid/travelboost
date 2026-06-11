import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractImageSrc, formatIDR } from '@/lib/utils';
import { edit } from '@/routes/admin/tours/products';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { EyeIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type { AdminTourProductRow } from './tour-product-types';

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-start gap-4 border-b border-border py-2.5 last:border-b-0">
            <span className="text-sm font-medium text-muted-foreground">
                {label}
            </span>
            <span className="col-span-2 break-words text-sm font-medium text-foreground">
                {value || '—'}
            </span>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </h3>
    );
}

export function TourProductRowActions({ tour }: { tour: AdminTourProductRow }) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const imageSrc = tour.image ? extractImageSrc(tour.image as any).src : null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(event) => {
                            event.preventDefault();
                            setDetailsOpen(true);
                        }}
                    >
                        <EyeIcon className="size-4" />
                        View details
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                            href={edit({ tour: tour.id }).url}
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="size-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Tour product details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-1">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt={tour.name}
                                className="aspect-video w-full max-w-sm rounded-lg border object-cover"
                            />
                        ) : null}

                        <div>
                            <SectionTitle>Overview</SectionTitle>
                            <DetailRow label="ID" value={tour.id} />
                            <DetailRow label="Code" value={tour.code} />
                            <DetailRow label="Name" value={tour.name} />
                            <DetailRow
                                label="Description"
                                value={tour.description}
                            />
                            <DetailRow
                                label="Status"
                                value={
                                    <Badge
                                        variant={
                                            tour.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="capitalize"
                                    >
                                        {tour.status}
                                    </Badge>
                                }
                            />
                            <DetailRow
                                label="Duration"
                                value={
                                    tour.duration_days
                                        ? `${tour.duration_days} day(s)`
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Vendor"
                                value={tour.company?.name}
                            />
                            <DetailRow
                                label="Category"
                                value={tour.category?.name}
                            />
                            <DetailRow
                                label="Schedules"
                                value={tour.schedules_count}
                            />
                        </div>

                        <div>
                            <SectionTitle>Location</SectionTitle>
                            <DetailRow
                                label="Continent"
                                value={tour.continent_name}
                            />
                            <DetailRow
                                label="Region"
                                value={tour.region_name}
                            />
                            <DetailRow
                                label="Country"
                                value={tour.country_name}
                            />
                            <DetailRow
                                label="Destination"
                                value={tour.destination}
                            />
                        </div>

                        <div>
                            <SectionTitle>Catalog pricing</SectionTitle>
                            <DetailRow
                                label="Show price"
                                value={
                                    tour.showprice != null
                                        ? formatIDR(tour.showprice)
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Promote title"
                                value={tour.promote_title}
                            />
                            <DetailRow
                                label="Promote price"
                                value={
                                    tour.promote_price
                                        ? formatIDR(tour.promote_price)
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Promote note"
                                value={tour.promote_note}
                            />
                            <DetailRow
                                label="Early bird"
                                value={
                                    tour.earlybird
                                        ? formatIDR(tour.earlybird)
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Early bird note"
                                value={tour.earlybird_note}
                            />
                            <DetailRow label="Currency" value={tour.currency} />
                        </div>

                        <DetailRow
                            label="Created"
                            value={
                                tour.created_at
                                    ? dayjs(tour.created_at).format(
                                          'D MMM YYYY, HH:mm',
                                      )
                                    : undefined
                            }
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
