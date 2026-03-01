'use client';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ShieldBanIcon, Trash2Icon, UserIcon, UserPenIcon } from 'lucide-react';
import { EmptyCustomers } from './components/empty-customers';
dayjs.extend(relativeTime);

const MemberRow = ({ customer }: { customer: any }) => {
  console.log(customer);
  return (
    <TableRow key={customer.id} className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 flex gap-2 items-center">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage
            src={customer.photo_url || DEFAULT_PHOTO}
            alt={customer.name}
          />
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">
            {customer.sername}
          </div>
        </div>
      </TableCell>
      <TableCell className="h-16 px-4 font-medium">{customer.email}</TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        <Badge>{customer.role}</Badge>
      </TableCell>
      <TableCell className="h-16 px-4">
        <Badge>active</Badge>
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {dayjs(customer.created_at).fromNow()}
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                disabled={customer.role === 'superadmin'}
                aria-label="Delete"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={customer.role === 'superadmin'}
                aria-label="Suspend"
              >
                <ShieldBanIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Suspend</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={customer.role === 'superadmin'}
                aria-label="Edit"
              >
                <UserPenIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function Customers({ customers }: { customers: any[] }) {
  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Customers' }]}
    >
      {customers.length ? (
        <div className="rounded-lg border bg-card w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="h-12 px-4 font-medium">User</TableHead>
                <TableHead className="h-12 px-4 font-medium">Email</TableHead>
                <TableHead className="h-12 px-4 font-medium w-30">
                  Role
                </TableHead>
                <TableHead className="h-12 px-4 font-medium">Status</TableHead>
                <TableHead className="h-12 px-4 font-medium">
                  Invited Date
                </TableHead>
                <TableHead className="h-12 px-4 font-medium w-45">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <MemberRow key={customer.id} customer={customer} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyCustomers />
      )}
    </CompanyDashboardLayout>
  );
}
