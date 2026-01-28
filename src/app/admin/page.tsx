'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Prompt, UserProfile } from '@/lib/types';
import { collection, query } from 'firebase/firestore';
import { Users, FileText, DollarSign, Loader2 } from 'lucide-react';

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) {
    return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
          </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  // Assuming a top-level 'prompts' collection
  const promptsQuery = useMemoFirebase(() => query(collection(firestore, 'prompts')), [firestore]);
  const { data: prompts, isLoading: promptsLoading } = useCollection<Prompt>(promptsQuery);
  
  // Note: Total Sales calculation would require querying 'orders' collection which is not implemented yet.
  // Using a placeholder for now.
  const totalSales = "Not Implemented";


  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <StatCard title="Total Users" value={users?.length ?? 0} icon={Users} isLoading={usersLoading} />
        <StatCard title="Total Prompts" value={prompts?.length ?? 0} icon={FileText} isLoading={promptsLoading} />
        <StatCard title="Total Sales" value={totalSales} icon={DollarSign} isLoading={false} />
      </div>
    </>
  );
}
