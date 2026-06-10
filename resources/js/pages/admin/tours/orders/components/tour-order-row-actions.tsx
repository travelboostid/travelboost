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
import { formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import { ExternalLink, EyeIcon, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { BookingStatusBadge } from './booking-status-badge';
import type { AdminTourOrderRow } from './tour-order-types';

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

function vendorBookingUrl(order: AdminTourOrderRow): string | null {
    if (!order.vendor?.username) {
        return null;
    }

    return `/companies/${order.vendor.username}/dashboard/bookings/${order.id}`;
}

export function TourOrderRowActions({ order }: { order: AdminTourOrderRow }) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const bookingUrl = vendorBookingUrl(order);
    const totalPax = order.pax_adult + order.pax_child + order.pax_infant;

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
                    {bookingUrl ? (
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="size-4" />
                                Open booking
                            </a>
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Order details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-1">
                        <div>
                            <SectionTitle>Booking</SectionTitle>
                            <DetailRow label="ID" value={order.id} />
                            <DetailRow
                                label="Booking no."
                                value={
                                    <span className="font-mono text-xs">
                                        {order.booking_number}
                                    </span>
                                }
                            />
                            <DetailRow
                                label="Invoice"
                                value={order.invoice_number}
                            />
                            <DetailRow
                                label="Status"
                                value={
                                    <BookingStatusBadge status={order.status} />
                                }
                            />
                            <DetailRow
                                label="Departure"
                                value={
                                    order.departure_date
                                        ? dayjs(order.departure_date).format(
                                              'D MMM YYYY',
                                          )
                                        : undefined
                                }
                            />
                            <DetailRow
                                label="Payment mode"
                                value={order.payment_mode}
                            />
                        </div>

                        <div>
                            <SectionTitle>Customer</SectionTitle>
                            <DetailRow
                                label="Name"
                                value={order.contact_name}
                            />
                            <DetailRow
                                label="Email"
                                value={order.contact_email}
                            />
                            <DetailRow
                                label="Phone"
                                value={order.contact_phone}
                            />
                            <DetailRow
                                label="Note"
                                value={order.contact_notes}
                            />
                            <DetailRow
                                label="Passengers"
                                value={`${totalPax} (A${order.pax_adult} / C${order.pax_child} / I${order.pax_infant})`}
                            />
                        </div>

                        <div>
                            <SectionTitle>Tour</SectionTitle>
                            <DetailRow label="Tour" value={order.tour?.name} />
                            <DetailRow
                                label="Code"
                                value={
                                    order.tour?.code ? (
                                        <Badge
                                            variant="outline"
                                            className="font-mono"
                                        >
                                            {order.tour.code}
                                        </Badge>
                                    ) : undefined
                                }
                            />
                            <DetailRow
                                label="Vendor"
                                value={order.vendor?.name}
                            />
                            <DetailRow
                                label="Agent"
                                value={order.agent?.name}
                            />
                        </div>

                        <div>
                            <SectionTitle>Payment</SectionTitle>
                            <DetailRow
                                label="Grand total"
                                value={formatIDR(order.grand_total)}
                            />
                            <DetailRow
                                label="Paid"
                                value={formatIDR(order.paid_amount)}
                            />
                            <DetailRow
                                label="Outstanding"
                                value={formatIDR(
                                    Math.max(
                                        0,
                                        order.grand_total - order.paid_amount,
                                    ),
                                )}
                            />
                        </div>

                        <DetailRow
                            label="Created"
                            value={dayjs(order.created_at).format(
                                'D MMM YYYY, HH:mm',
                            )}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
