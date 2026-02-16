'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, TrendingUp } from 'lucide-react'

export type TopSeller = {
  userId: string
  displayName: string
  photoURL?: string
  salesCount: number
  totalEarnings: number // in EUR
  promptsCount: number
}

export function TopSellersTable({ sellers }: { sellers: TopSeller[] }) {
  if (!sellers || sellers.length === 0) {
    return <p className='text-muted-foreground text-center py-4'>No seller data available.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seller</TableHead>
            <TableHead className="text-center">Prompts</TableHead>
            <TableHead className="text-center">Sales</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller) => (
            <TableRow key={seller.userId}>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-9 w-9'>
                    <AvatarImage src={seller.photoURL} alt={seller.displayName} />
                    <AvatarFallback>{seller.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className='font-medium'>{seller.displayName}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className='flex items-center justify-center gap-1.5'>
                    <Package className='h-4 w-4 text-muted-foreground' />
                    {seller.promptsCount}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className='flex items-center justify-center gap-1.5'>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    {seller.salesCount}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(seller.totalEarnings)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
