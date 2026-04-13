import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Head, useForm } from '@inertiajs/react';
import { Check, Mail, MapPin, Phone, UserIcon, X } from 'lucide-react';

export default function AffiliateApprovals({ pendingAffiliates }: any) {
  const { post, processing } = useForm();

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    if (confirm(`Are you sure you want to ${action} this affiliate?`)) {
      post(`/affiliate/dashboard/affiliate/approvals/${id}/${action}`);
    }
  };

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Affiliate', url: '#' },
        { title: 'Approvals', url: '#' },
      ]}
    >
      <Head title="Pending Approvals" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pending Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and approve new affiliate registrations in your network.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>User Information</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-center w-[200px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAffiliates.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No pending applications found.
                  </TableCell>
                </TableRow>
              ) : (
                pendingAffiliates.data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              item.profile_photo_path
                                ? `/storage/${item.profile_photo_path}`
                                : ''
                            }
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {item.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-slate-900">
                            {item.user.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                          >
                            View Profile Detail
                          </Button>
                        </DialogTrigger>
                        {/* Di sini kuncinya: sm:max-w-[450px] w-[95vw] agar ukurannya dikunci kecil dan posisinya di tengah */}
                        <DialogContent className="sm:max-w-[450px] w-[95vw] p-6 rounded-xl overflow-hidden">
                          <DialogHeader className="mb-2">
                            <DialogTitle className="text-lg">
                              Profile Details
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Detailed information for {item.user.name}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-5">
                            {/* Header Info Avatar */}
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                              <Avatar className="w-14 h-14 border border-slate-200 shadow-sm">
                                <AvatarImage
                                  src={
                                    item.profile_photo_path
                                      ? `/storage/${item.profile_photo_path}`
                                      : ''
                                  }
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-100">
                                  <UserIcon className="w-6 h-6 text-slate-400" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-bold text-slate-900 text-base leading-tight">
                                  {item.user.name}
                                </h4>
                                <p className="text-sm text-slate-500 font-medium">
                                  @{item.user.username}
                                </p>
                              </div>
                            </div>

                            {/* Daftar Data */}
                            <div className="grid gap-4 text-sm">
                              <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-700 mb-0.5">
                                    Email Address
                                  </p>
                                  <p className="text-slate-600">
                                    {item.user.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-700 mb-0.5">
                                    Phone / WhatsApp
                                  </p>
                                  <p className="text-slate-600">
                                    {item.phone || (
                                      <span className="text-slate-400 italic">
                                        Not provided
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-700 mb-0.5">
                                    Address
                                  </p>
                                  <div className="text-slate-600 leading-normal">
                                    {item.address ? (
                                      <>
                                        <p>{item.address}</p>
                                        <p className="mt-1 opacity-80">
                                          {[
                                            item.city,
                                            item.province,
                                            item.postal_code,
                                          ]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </p>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 italic">
                                        Not provided
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>

                    {/* Action Center */}
                    <TableCell>
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 shadow-sm"
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={processing}
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 text-emerald-100 hover:bg-emerald-700 shadow-sm"
                          onClick={() => handleAction(item.id, 'approve')}
                          disabled={processing}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AffiliateDashboardLayout>
  );
}
