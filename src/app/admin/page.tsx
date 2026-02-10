'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Prompt, PromptComment, UserProfile } from '@/lib/types';
import { collection, collectionGroup, query } from 'firebase/firestore';
import { Users, FileText, DollarSign, Loader2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  const promptsQuery = useMemoFirebase(() => query(collection(firestore, 'prompts')), [firestore]);
  const { data: prompts, isLoading: promptsLoading } = useCollection<Prompt>(promptsQuery);
  
  const commentsQuery = useMemoFirebase(() => query(collectionGroup(firestore, 'comments')), [firestore]);
  const { data: allComments, isLoading: commentsLoading } = useCollection<PromptComment>(commentsQuery);

  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({1:0, 2:0, 3:0, 4:0, 5:0});

  useEffect(() => {
    if (allComments) {
        const counts = allComments.reduce((acc, comment) => {
            const rating = Math.round(comment.rating);
            if (rating >= 1 && rating <= 5) {
                acc[rating] = (acc[rating] || 0) + 1;
            }
            return acc;
        }, {1:0, 2:0, 3:0, 4:0, 5:0} as Record<number, number>);
        setRatingCounts(counts);
    }
  }, [allComments]);

  // Note: Total Sales calculation would require querying 'orders' collection which is not implemented yet.
  // Using a placeholder for now.
  const totalSales = "Not Implemented";

  const ratingsOrder = [5, 4, 3, 2, 1];

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
      
      <Card>
        <CardHeader>
          <CardTitle>Review Ratings</CardTitle>
          <CardDescription>A summary of all ratings given by users.</CardDescription>
        </CardHeader>
        <CardContent>
          {commentsLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {ratingsOrder.map(rating => (
                    <TableHead key={rating} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {ratingsOrder.map(rating => (
                    <TableCell key={rating} className="text-center font-bold text-lg">
                      {ratingCounts[rating].toLocaleString()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
