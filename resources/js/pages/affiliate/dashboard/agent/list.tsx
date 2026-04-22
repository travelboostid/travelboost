import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ChevronLeft,
  ChevronRight,
  Eye,
  HeadphonesIcon,
  IdCard,
  Mail,
  MapPin,
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
        item.ma_name?.toLowerCase().includes(searchTerm.toLowerCase()),
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
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
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
        <h1 className="text-2xl font-bold">Agent</h1>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search agent, email, MA, or affiliator..."
              className="pl-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-blue-600" /> Agent Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
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
                      className="cursor-pointer hover:bg-slate-100"
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
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-1">
                        Phone{' '}
                        {sortKey === 'phone' &&
                          (sortOrder === 'asc' ? (
                            <ArrowDownAZ className="size-3" />
                          ) : (
                            <ArrowUpZA className="size-3" />
                          ))}
                      </div>
                    </TableHead>

                    {isPartner && (
                      <TableHead
                        className="cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('ma_name')}
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
                        className="cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('affiliator_name')}
                      >
                        <div className="flex items-center gap-1">
                          Affiliator{' '}
                          {sortKey === 'affiliator_name' &&
                            (sortOrder === 'asc' ? (
                              <ArrowDownAZ className="size-3" />
                            ) : (
                              <ArrowUpZA className="size-3" />
                            ))}
                        </div>
                      </TableHead>
                    )}

                    <TableHead
                      className="cursor-pointer hover:bg-slate-100"
                      onClick={() => handleSort('join_date')}
                    >
                      <div className="flex items-center gap-1">
                        Join Date{' '}
                        {sortKey === 'join_date' &&
                          (sortOrder === 'asc' ? (
                            <ArrowDownAZ className="size-3" />
                          ) : (
                            <ArrowUpZA className="size-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isPartner ? 7 : isMaster ? 6 : 5}
                        className="h-24 text-center text-slate-500"
                      >
                        No agents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          {item.name}
                        </TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone || '-'}</TableCell>
                        {isPartner && <TableCell>{item.ma_name}</TableCell>}
                        {(isPartner || isMaster) && (
                          <TableCell>{item.affiliator_name}</TableCell>
                        )}
                        <TableCell>{item.join_date}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAgent(item)}
                          >
                            <Eye className="size-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
                {filteredData.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Profile</DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-2">
              <Avatar className="h-20 w-20 border-4 border-slate-100 dark:border-slate-800">
                {selectedAgent.photo_url && (
                  <AvatarImage
                    src={selectedAgent.photo_url}
                    alt={selectedAgent.name}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {selectedAgent.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAgent.name}
                </h3>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-600">
                  Agent Partner
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Mail className="size-3" /> Email Address
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedAgent.email || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Phone className="size-3" /> Phone Number
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedAgent.phone || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <HeadphonesIcon className="size-3" /> CS Phone
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedAgent.customer_service_phone || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1">Join Date</span>
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {selectedAgent.join_date}
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="size-3" /> Address
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedAgent.address || '-'}
                  </span>
                </div>

                {(isPartner || isMaster) && (
                  <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                    {isPartner && (
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 mb-1">
                          Master Affiliate
                        </span>
                        <span className="text-sm font-medium text-blue-700">
                          {selectedAgent.ma_name}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1">
                        Affiliator
                      </span>
                      <span className="text-sm font-medium text-blue-700">
                        {selectedAgent.affiliator_name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col col-span-2 border-t pt-4 mt-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <IdCard className="size-3" /> Identity Number (NIK)
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedAgent.identity_number || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-2">
                    ID Photo Document
                  </span>
                  {selectedAgent.identity_photo_path ? (
                    <img
                      src={`/storage/${selectedAgent.identity_photo_path}`}
                      alt="ID Document"
                      className="w-full max-w-sm rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        setPreviewImage(
                          `/storage/${selectedAgent.identity_photo_path}`,
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
