'use client';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import InviteTeamButton from './components/invite-team-button';
import TeamRow from './components/team-row';
dayjs.extend(relativeTime);

export type TeamsPageProps = {
  members: any[];
  roles: any[];
};

export default function Teams({ members, roles }: TeamsPageProps) {
  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'User Management' }]}
      openMenuIds={['settings']}
      activeMenuIds={['settings.teams']}
      applet={<InviteTeamButton roles={roles} />}
    >
      <Head title="User Management" />
      <div className="rounded-lg border bg-card w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="h-12 px-4 font-medium">User</TableHead>
              <TableHead className="h-12 px-4 font-medium">Email</TableHead>
              <TableHead className="h-12 px-4 font-medium w-30">Role</TableHead>
              <TableHead className="h-12 px-4 font-medium">Status</TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Invited Date
              </TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Accepted Date
              </TableHead>
              <TableHead className="h-12 px-4 font-medium w-45">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TeamRow key={member.id} team={member} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CompanyDashboardLayout>
  );
}
