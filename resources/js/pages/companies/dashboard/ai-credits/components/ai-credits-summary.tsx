import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import type { AiCreditsPageProps } from '..';

export default function AiCreditsSummary() {
  const { credit, usageCostToday, usageCostIn30Days } =
    usePageProps<AiCreditsPageProps>();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card col-span-2">
        <CardHeader>
          <CardDescription>Available Credits</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatIDR(credit?.balance || 0)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Usage Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatIDR(usageCostToday || 0)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
        <CardHeader>
          <CardDescription>Usage Last 30 Days</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatIDR(usageCostIn30Days || 0)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
