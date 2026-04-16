import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { Head, Link } from '@inertiajs/react';
import { Building2, Eye, Mail } from 'lucide-react';
import { useState } from 'react';

export default function AgentList({ agents, isMaster }: any) {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
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
        <h1 className="text-2xl font-bold">Agent Referrals</h1>
        <Card>
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-blue-600" /> Agent Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  {isMaster && <TableHead>Invited By</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </TableCell>
                    {isMaster && (
                      <TableCell>
                        <Badge variant="outline">{item.affiliator_name}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        className={
                          item.status === 'Subscribed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.package}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {formatCurrency(item.potential_commission)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAgent(item)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination UI Minimal */}
            <div className="p-4 border-t flex justify-end gap-2">
              {agents.links.map((link: any, i: number) => (
                <Button
                  key={i}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  asChild
                  disabled={!link.url}
                >
                  <Link
                    href={link.url || '#'}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedAgent}
        onOpenChange={() => setSelectedAgent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent Detail</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-lg">
                  <AvatarFallback>{selectedAgent.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedAgent.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Mail className="size-3" /> {selectedAgent.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">
                    Invited By
                  </span>{' '}
                  {selectedAgent.affiliator_name}
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">
                    Registered
                  </span>{' '}
                  {selectedAgent.created_at}
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Package</span>{' '}
                  {selectedAgent.package}
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">
                    Sub. Date
                  </span>{' '}
                  {selectedAgent.subscription_date}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AffiliateDashboardLayout>
  );
}
