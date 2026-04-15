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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Eye, Mail, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';

export default function NetworkApprovals() {
  const { auth, pending_approvals } = usePage().props as any;
  const user = auth?.user;
  const isPartner = user?.affiliate_profile?.tier === 'partner';

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const dataList = pending_approvals || [
    {
      id: 3,
      name: 'Alex Wijaya',
      username: 'alex-wj',
      email: 'alex@mail.com',
      registered_at: '2026-04-14',
    },
  ];

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    if (confirm(`Are you sure you want to ${action} this application?`)) {
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
              ? 'Review and approve new Master Affiliate applications.'
              : 'Review and approve new Affiliators joining your network.'}
          </p>
        </div>

        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/50 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-500">
              <ShieldAlert className="size-5" />
              Pending Applications
            </CardTitle>
            <CardDescription className="text-amber-700/70 dark:text-amber-600/70">
              Users waiting for your approval to activate their account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-slate-500"
                      >
                        No pending approvals at the moment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataList.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                            {item.username}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {item.registered_at}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* [VIEW BUTTON ADDED] */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => setSelectedUser(item)}
                            >
                              <Eye className="size-4 mr-1" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                              onClick={() => handleAction(item.id, 'reject')}
                            >
                              <X className="size-4 mr-1" /> Reject
                            </Button>
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

      {/* [MODAL PROFILE] */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Applicant Profile</DialogTitle>
            <DialogDescription>
              Review applicant details before approving.
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

              <div className="w-full grid gap-4 mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Mail className="size-3" /> Email Address
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.email || '-'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1">
                    Applied Date
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedUser.registered_at}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AffiliateDashboardLayout>
  );
}
