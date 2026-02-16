'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, Star, Coins } from 'lucide-react'
import Link from 'next/link'

export type TopProduct = {
  id: string
  name: string
  type: 'prompt' | 'credits' | 'subscription'
  salesCount: number
  totalRevenue: number
}

const typeIconMap = {
  prompt: Package,
  subscription: Star,
  credits: Coins,
}

export function TopProductsTable({ products }: { products: TopProduct[] }) {
  if (!products || products.length === 0) {
    return <p className='text-muted-foreground text-center py-4'>No product data for this period.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-center">Sales</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const Icon = typeIconMap[product.type]
            const isPrompt = product.type === 'prompt'
            const promptId = isPrompt ? product.id.replace('prompt-', '') : null
            
            return (
                <TableRow key={product.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium truncate">
                            {isPrompt && promptId ? (
                                <Link href={`/prompt/${promptId}`} className="hover:underline" title={product.name}>
                                    {product.name}
                                </Link>
                            ) : (
                                <span title={product.name}>{product.name}</span>
                            )}
                        </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-center">{product.salesCount}</TableCell>
                    <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(product.totalRevenue)}
                    </TableCell>
                </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
