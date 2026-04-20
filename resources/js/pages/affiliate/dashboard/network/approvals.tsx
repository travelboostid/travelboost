import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Head, router, usePage } from '@inertiajs/react';
import {
  Check,
  Eye,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function NetworkApprovals() {
  const { auth, pending_approvals } = usePage().props as any;
  const user = auth?.user;
  const isPartner = user?.affiliate_profile?.tier === 'partner';

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const dataList = pending_approvals || [];

  const filteredList = dataList.filter(
    (item: any) =>
      item.status === activeTab &&
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const actionText =
      action === 'approve' ? 'approve and activate' : 'reject and deactivate';
    if (confirm(`Are you sure you want to ${actionText} this application?`)) {
      router.post(`/affiliate/dashboard/network/approvals/${id}/${action}`);
    }
  };

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Dashboard', url: '/affiliate/dashboard' },
        {
          title: isPartner ? 'Master Affiliate' : 'Affiliate Network',
          url: '#',
        },
        { title: 'Approvals', url: '/affiliate/dashboard/network/approvals' },
      ]}
    >
      <Head title={isPartner ? 'MA Approvals' : 'Affiliate Approvals'} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isPartner ? 'Master Affiliate Approvals' : 'Affiliate Approvals'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isPartner
              ? 'Review and manage Master Affiliate applications.'
              : 'Review and manage Affiliators joining your network.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'rejected' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Rejected
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search name, username, email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card
          className={
            activeTab === 'pending' ? 'border-amber-200' : 'border-slate-200'
          }
        >
          <CardHeader
            className={`${activeTab === 'pending' ? 'bg-amber-50/50' : 'bg-slate-50'} border-b rounded-t-xl`}
          >
            <CardTitle
              className={`text-lg flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-800' : 'text-slate-800'}`}
            >
              <ShieldAlert className="size-5" />
              {activeTab === 'pending'
                ? 'Pending Applications'
                : 'Rejected Applications'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'pending'
                ? 'Users waiting for your approval to activate their account.'
                : 'Users whose applications were previously rejected.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-slate-500"
                      >
                        No {activeTab} applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                            {item.username}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{item.email}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {item.registered_at}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => setSelectedUser(item)}
                            >
                              <Eye className="size-4 mr-1" /> View
                            </Button>

                            {activeTab === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                onClick={() => handleAction(item.id, 'reject')}
                              >
                                <X className="size-4 mr-1" /> Reject
                              </Button>
                            )}

                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleAction(item.id, 'approve')}
                            >
                              <Check className="size-4 mr-1" /> Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicant Profile</DialogTitle>
            <DialogDescription>
              Review complete applicant details.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-2">
              <Avatar className="h-20 w-20 border-4 border-slate-100 dark:border-slate-800">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedUser.name}
                </h3>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-600">
                  @{selectedUser.username}
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Mail className="size-3" /> Email Address
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.email || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 md:col-span-1">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Phone className="size-3" /> Phone Number
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.phone || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="size-3" /> Address
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.address || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 border-t pt-4 mt-2">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <IdCard className="size-3" /> Identity Number (NIK)
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.identity_number || '-'}
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-xs text-slate-500 mb-2">
                    ID Photo Document
                  </span>
                  {selectedUser.identity_photo_path ? (
                    <img
                      src={`/storage/${selectedUser.identity_photo_path}`}
                      alt="ID Document"
                      className="w-full max-w-sm rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        setPreviewImage(
                          `/storage/${selectedUser.identity_photo_path}`,
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

      {/* Fullscreen Image Preview */}
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
