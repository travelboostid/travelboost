import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Head, usePage } from '@inertiajs/react';
import { ArrowDownAZ, ArrowUpZA, BarChart3, ChevronLeft, ChevronRight, Eye, Mail, Phone } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function NetworkList() {
  const { url, props } = usePage();
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const viewTier = searchParams.get('tier') || 'affiliate';
  
  const { networks } = props as any;
  
  const title = viewTier === 'ma' ? 'Master Affiliate List' : 'Affiliate List';
  const description = viewTier === 'ma' 
    ? 'Monitor your Master Affiliates and their network performance.'
    : 'Manage affiliators registered under your downline.';

  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const itemsPerPage = 10;

  // Integrasi Data Asli
  const processedData = useMemo(() => {
    const rawData = Array.isArray(networks) ? networks : [];
    return rawData.map((user: any) => {
      const total_agents = user.total_agents || 0;
      const subscribed_agents = user.subscribed_agents || 0;
      const total_affiliators = user.total_affiliators || 0;
      const conversion = total_agents > 0 ? (subscribed_agents / total_agents) * 100 : 0;

      return {
        ...user,
        total_affiliators,
        total_agents,
        subscribed_agents,
        conversion,
        joined_at: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : 'N/A',
      };
    });
  }, [networks]);

  const sortedData = useMemo(() => {
    return [...processedData].sort((a: any, b: any) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [processedData, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const maxAgents = Math.max(...paginatedData.map(d => d.total_agents), 1);

  return (
    <AffiliateDashboardLayout breadcrumb={[{ title: 'Dashboard', url: '/affiliate/dashboard' }, { title: 'Network', url: '#' }, { title: title, url: '#' }]}>
      <Head title={title} />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="text-slate-500 text-sm mt-1">{description}</p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 pb-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-blue-600" /> Network Comparison (Current Page)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-56 w-full flex items-end justify-around gap-4 px-2">
              {paginatedData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No data to display</div>
              ) : (
                paginatedData.map((item, i) => {
                  const heightTotal = (item.total_agents / maxAgents) * 100;
                  
                  return (
                    <div key={i} className="relative group flex flex-col items-center justify-end h-full w-full max-w-[60px]">
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded-md py-2 px-3 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                        <p className="font-bold border-b border-slate-700 pb-1 mb-1">{item.name}</p>
                        {viewTier === 'ma' && <p>Affiliators: {item.total_affiliators}</p>}
                        <p>Invited: {item.total_agents} Agents</p>
                        <p className="text-blue-300">Subscribed: {item.subscribed_agents} Agents</p>
                      </div>

                      <div className="w-full relative rounded-t-sm bg-blue-100 dark:bg-blue-900/30 hover:brightness-95 transition-all" style={{ height: `${heightTotal}%` }}>
                        <div className="absolute bottom-0 w-full rounded-t-sm bg-blue-600 dark:bg-blue-500" style={{ height: `${item.conversion}%` }} />
                      </div>
                      
                      <span className="text-[10px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                        {item.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">Name {sortKey === 'name' && (sortOrder === 'asc' ? <ArrowDownAZ className="size-3"/> : <ArrowUpZA className="size-3"/>)}</div>
                    </TableHead>
                    <TableHead>Username</TableHead>
                    {viewTier === 'ma' && (
                      <TableHead className="text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('total_affiliators')}>
                        <div className="flex justify-center items-center gap-1">Affiliators {sortKey === 'total_affiliators' && (sortOrder === 'asc' ? <ArrowDownAZ className="size-3"/> : <ArrowUpZA className="size-3"/>)}</div>
                      </TableHead>
                    )}
                    <TableHead className="text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('total_agents')}>
                      <div className="flex justify-center items-center gap-1">Agents {sortKey === 'total_agents' && (sortOrder === 'asc' ? <ArrowDownAZ className="size-3"/> : <ArrowUpZA className="size-3"/>)}</div>
                    </TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('conversion')}>
                      <div className="flex items-center gap-1">Conversion {sortKey === 'conversion' && (sortOrder === 'asc' ? <ArrowDownAZ className="size-3"/> : <ArrowUpZA className="size-3"/>)}</div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('joined_at')}>
                      <div className="flex justify-end items-center gap-1">Joined Date {sortKey === 'joined_at' && (sortOrder === 'asc' ? <ArrowDownAZ className="size-3"/> : <ArrowUpZA className="size-3"/>)}</div>
                    </TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-slate-500">No data found.</TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-mono font-normal">{item.username}</Badge></TableCell>
                        
                        {viewTier === 'ma' && (
                          <TableCell className="text-center font-semibold">{item.total_affiliators}</TableCell>
                        )}
                        
                        <TableCell className="text-center font-semibold">{item.total_agents}</TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.conversion}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-10 text-right">
                              {Math.round(item.conversion)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{item.subscribed_agents} Subscribed</p>
                        </TableCell>
                        
                        <TableCell className="text-right text-sm text-slate-500">{item.joined_at}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setSelectedUser(item)}>
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Detailed view of the selected network partner.</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-2">
              <Avatar className="h-20 w-20 border-4 border-slate-100 dark:border-slate-800">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">{selectedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                <Badge variant="outline" className="uppercase bg-slate-50 text-slate-600 tracking-wider text-[10px]">
                  {selectedUser.tier === 'master_affiliate' ? 'Master Affiliate' : 'Affiliator'}
                </Badge>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1">Referral Code</span>
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedUser.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1">Joined Date</span>
                  <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedUser.joined_at}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Mail className="size-3"/> Email Address</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.email}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Phone className="size-3"/> Phone Number</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedUser.phone || '-'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AffiliateDashboardLayout>
  );
}