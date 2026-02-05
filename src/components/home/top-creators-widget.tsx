import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DUMMY_CREATORS } from '@/lib/dummy-data';
import { cn } from '@/lib/utils';
import { Crown, TrendingUp } from 'lucide-react';

type TopCreatorsWidgetProps = {
  className?: string;
};

const creatorsByWeek = [...DUMMY_CREATORS].sort(
  (a, b) => (b.stats?.weeklySales ?? 0) - (a.stats?.weeklySales ?? 0)
);
const creatorsByMonth = [...DUMMY_CREATORS].sort(
  (a, b) => (b.stats?.monthlySales ?? 0) - (a.stats?.monthlySales ?? 0)
);
const creatorsByAllTime = [...DUMMY_CREATORS].sort(
  (a, b) => (b.stats?.totalSales ?? 0) - (a.stats?.totalSales ?? 0)
);


const CreatorList = ({ creators, metric }: { creators: typeof DUMMY_CREATORS, metric: 'weekly' | 'monthly' | 'total' }) => (
    <div className="space-y-4">
    {creators.slice(0, 5).map((creator, index) => (
      <div key={creator.uid} className="flex items-center gap-4">
        <span className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
        <Avatar>
          <AvatarImage src={creator.photoURL} alt={creator.displayName} />
          <AvatarFallback>{creator.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="font-semibold truncate">{creator.displayName}</p>
          <p className="text-sm text-muted-foreground">
            {metric === 'total' && `$${((creator.stats?.totalSales ?? 0) / 1000).toFixed(1)}k sales`}
            {metric === 'monthly' && `$${((creator.stats?.monthlySales ?? 0) / 1000).toFixed(1)}k this month`}
            {metric === 'weekly' && `$${creator.stats?.weeklySales ?? 0} this week`}
          </p>
        </div>
        {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
      </div>
    ))}
  </div>
);

export default function TopCreatorsWidget({ className }: TopCreatorsWidgetProps) {
  return (
    <aside className={cn('space-y-6', className)}>
      <div className="sticky top-24">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6" /> Top Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
              </TabsList>
              <TabsContent value="week" className="mt-4">
                <CreatorList creators={creatorsByWeek} metric="weekly" />
              </TabsContent>
              <TabsContent value="month" className="mt-4">
                 <CreatorList creators={creatorsByMonth} metric="monthly" />
              </TabsContent>
              <TabsContent value="all-time" className="mt-4">
                 <CreatorList creators={creatorsByAllTime} metric="total" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
