import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Head } from '@inertiajs/react';
import {
    ArrowDownAZ,
    ArrowUpZA,
    Building2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Eye,
    HeadphonesIcon,
    IdCard,
    Mail,
    MapPin,
    Package,
    Phone,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function AgentList({ agents, userTier }: any) {
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState('join_date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const itemsPerPage = 10;
    const isPartner = userTier === 'partner';
    const isMaster =
        userTier === 'master_affiliate' || userTier === 'master-affiliate';

    const filteredData = useMemo(() => {
        const rawData = Array.isArray(agents) ? agents : [];
        return rawData.filter(
            (item) =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.affiliator_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.ma_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.subscription_package
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        );
    }, [agents, searchTerm]);

    const sortedData = useMemo(() => {
        return [...filteredData].sort((a: any, b: any) => {
            if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortKey, sortOrder]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const handleSort = (key: string) => {
        if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <AffiliateDashboardLayout
            breadcrumb={[
                { title: 'Agent', url: '#' },
                { title: 'List', url: '#' },
            ]}
        >
            <Head title="Agent List" />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search agent, email, package..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                <Card className="border-border">
                    <CardHeader className="border-b border-border bg-white px-5 py-0">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground py-0 my-0">
                            <Building2 className="size-4 text-primary" /> Agent
                            List
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50">
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Company{' '}
                                                {sortKey === 'name' &&
                                                    (sortOrder === 'asc' ? (
                                                        <ArrowDownAZ className="size-3" />
                                                    ) : (
                                                        <ArrowUpZA className="size-3" />
                                                    ))}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => handleSort('email')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Email{' '}
                                                {sortKey === 'email' &&
                                                    (sortOrder === 'asc' ? (
                                                        <ArrowDownAZ className="size-3" />
                                                    ) : (
                                                        <ArrowUpZA className="size-3" />
                                                    ))}
                                            </div>
                                        </TableHead>

                                        {/* Kolom Subscription Baru */}
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() =>
                                                handleSort(
                                                    'subscription_package',
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-1">
                                                Subscription{' '}
                                                {sortKey ===
                                                    'subscription_package' &&
                                                    (sortOrder === 'asc' ? (
                                                        <ArrowDownAZ className="size-3" />
                                                    ) : (
                                                        <ArrowUpZA className="size-3" />
                                                    ))}
                                            </div>
                                        </TableHead>

                                        {isPartner && (
                                            <TableHead
                                                className="cursor-pointer hover:bg-muted"
                                                onClick={() =>
                                                    handleSort('ma_name')
                                                }
                                            >
                                                <div className="flex items-center gap-1">
                                                    Master Affiliate{' '}
                                                    {sortKey === 'ma_name' &&
                                                        (sortOrder === 'asc' ? (
                                                            <ArrowDownAZ className="size-3" />
                                                        ) : (
                                                            <ArrowUpZA className="size-3" />
                                                        ))}
                                                </div>
                                            </TableHead>
                                        )}

                                        {(isPartner || isMaster) && (
                                            <TableHead
                                                className="cursor-pointer hover:bg-muted"
                                                onClick={() =>
                                                    handleSort(
                                                        'affiliator_name',
                                                    )
                                                }
                                            >
                                                <div className="flex items-center gap-1">
                                                    Affiliator{' '}
                                                    {sortKey ===
                                                        'affiliator_name' &&
                                                        (sortOrder === 'asc' ? (
                                                            <ArrowDownAZ className="size-3" />
                                                        ) : (
                                                            <ArrowUpZA className="size-3" />
                                                        ))}
                                                </div>
                                            </TableHead>
                                        )}

                                        <TableHead
                                            className="cursor-pointer hover:bg-muted text-right"
                                            onClick={() =>
                                                handleSort('join_date')
                                            }
                                        >
                                            <div className="flex justify-end items-center gap-1">
                                                Join Date{' '}
                                                {sortKey === 'join_date' &&
                                                    (sortOrder === 'asc' ? (
                                                        <ArrowDownAZ className="size-3" />
                                                    ) : (
                                                        <ArrowUpZA className="size-3" />
                                                    ))}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    isPartner
                                                        ? 7
                                                        : isMaster
                                                          ? 6
                                                          : 5
                                                }
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                No agents found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-semibold text-foreground">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {item.email}
                                                </TableCell>

                                                {/* Menampilkan Badge Subscription */}
                                                <TableCell>
                                                    <div className="flex flex-row items-start gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] uppercase font-semibold ${item.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.subscription_status === 'expired' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                                        >
                                                            {item.subscription_status ===
                                                            'active'
                                                                ? 'Active'
                                                                : item.subscription_status ===
                                                                    'expired'
                                                                  ? 'Expired'
                                                                  : 'Inactive'}
                                                        </Badge>
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {
                                                                item.subscription_package
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {isPartner && (
                                                    <TableCell className="text-sm">
                                                        {item.ma_name}
                                                    </TableCell>
                                                )}
                                                {(isPartner || isMaster) && (
                                                    <TableCell className="text-sm">
                                                        {item.affiliator_name}
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {item.join_date}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedAgent(
                                                                item,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="size-4 text-primary" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                            <span className="text-sm text-muted-foreground">
                                Showing {(currentPage - 1) * itemsPerPage + 1}{' '}
                                to{' '}
                                {Math.min(
                                    currentPage * itemsPerPage,
                                    filteredData.length,
                                )}{' '}
                                of {filteredData.length} entries
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={!!selectedAgent}
                onOpenChange={(open) => !open && setSelectedAgent(null)}
            >
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Agent Profile</DialogTitle>
                    </DialogHeader>

                    {selectedAgent && (
                        <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-2">
                            <Avatar className="h-20 w-20 border-4 border-border shadow-sm">
                                {selectedAgent.photo_url && (
                                    <AvatarImage
                                        src={selectedAgent.photo_url}
                                        alt={selectedAgent.name}
                                        className="object-cover"
                                    />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                    {selectedAgent.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-bold text-foreground">
                                    {selectedAgent.name}
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className="uppercase tracking-wider text-[10px]"
                                >
                                    Agent Partner
                                </Badge>
                            </div>

                            <div className="w-full grid grid-cols-1 gap-4 mt-2">
                                <div
                                    className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center ${selectedAgent.subscription_status === 'active' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}
                                >
                                    <Package
                                        className={`size-5 mb-2 ${selectedAgent.subscription_status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}
                                    />
                                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                                        Current Package
                                    </span>
                                    <span className="text-base font-bold text-foreground mt-0.5">
                                        {selectedAgent.subscription_package}
                                    </span>
                                    <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                                        <CalendarDays className="size-3" />{' '}
                                        Valid until:{' '}
                                        {selectedAgent.subscription_expired_at}
                                    </div>
                                </div>

                                {/* <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex flex-col justify-center items-center text-center">
                  <Sparkles className="size-5 mb-2 text-primary" />
                  <span className="text-xs text-primary/70 uppercase font-semibold tracking-wider">
                    AI Credit Balance
                  </span>
                  <span className="text-xl font-black text-primary mt-0.5">
                    {formatNumber(selectedAgent.ai_credit_balance)}
                  </span>
                </div> */}
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 mt-2 bg-muted/30 p-5 rounded-xl border border-border">
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Mail className="size-3" /> Email
                                        Address
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedAgent.email || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Phone className="size-3" /> Phone
                                        Number
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedAgent.phone || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <HeadphonesIcon className="size-3" /> CS
                                        Phone
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedAgent.customer_service_phone ||
                                            '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col col-span-2 md:col-span-1">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <CalendarDays className="size-3" /> Join
                                        Date
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-primary">
                                        {selectedAgent.join_date}
                                    </span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <MapPin className="size-3" /> Address
                                    </span>
                                    <span className="text-sm font-medium text-foreground leading-relaxed">
                                        {selectedAgent.address || '-'}
                                    </span>
                                </div>

                                {(isPartner || isMaster) && (
                                    <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                                        {isPartner && (
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground mb-1">
                                                    Master Affiliate
                                                </span>
                                                <span className="text-sm font-medium text-primary">
                                                    {selectedAgent.ma_name}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground mb-1">
                                                Affiliator
                                            </span>
                                            <span className="text-sm font-medium text-primary">
                                                {selectedAgent.affiliator_name}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col col-span-2 border-t border-border pt-4 mt-2">
                                    <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <IdCard className="size-3" /> Identity
                                        Number (NIK)
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedAgent.identity_number || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col col-span-2">
                                    <span className="text-xs text-muted-foreground mb-2">
                                        ID Photo Document
                                    </span>
                                    {selectedAgent.identity_card_url ? (
                                        <img
                                            src={
                                                selectedAgent.identity_card_url
                                            }
                                            alt="ID Document"
                                            className="w-full max-w-sm rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() =>
                                                setPreviewImage(
                                                    selectedAgent.identity_card_url,
                                                )
                                            }
                                        />
                                    ) : (
                                        <span className="text-sm italic text-slate-400">
                                            No document uploaded
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Full Preview"
                        className="max-w-full max-h-full rounded shadow-2xl"
                    />
                </div>
            )}
        </AffiliateDashboardLayout>
    );
}
