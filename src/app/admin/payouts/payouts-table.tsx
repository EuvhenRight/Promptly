'use client'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { PayoutRequest, UserProfile } from '@/lib/types'
import { format } from 'date-fns'
import {
	CheckCircle,
	CircleDollarSign,
	Loader2,
	MoreHorizontal,
	Send,
	XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updatePayoutStatus } from './actions'

export type EnrichedPayoutRequest = PayoutRequest & {
	user?: UserProfile
}

interface PayoutsTableProps {
	payouts: EnrichedPayoutRequest[]
}

const statusVariantMap: Record<
	PayoutRequest['status'],
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	pending: 'secondary',
	approved: 'default',
	paid: 'default',
	rejected: 'destructive',
}

const statusIconMap: Record<PayoutRequest['status'], React.ElementType> = {
	pending: Loader2,
	approved: CheckCircle,
	paid: Send,
	rejected: XCircle,
}

export function PayoutsTable({ payouts }: PayoutsTableProps) {
	const { toast } = useToast()
	const router = useRouter()
	const [actionState, setActionState] = useState<{
		isLoading: boolean
		payoutId: string | null
	}>({ isLoading: false, payoutId: null })
	const [confirmAction, setConfirmAction] = useState<{
		payout: EnrichedPayoutRequest
		status: 'approved' | 'rejected' | 'paid'
	} | null>(null)

	const handleAction = async () => {
		if (!confirmAction) return

		setActionState({ isLoading: true, payoutId: confirmAction.payout.id })
		const result = await updatePayoutStatus(
			confirmAction.payout.id,
			confirmAction.status,
		)
		if (result.success) {
			toast({
				title: 'Status Updated',
				description: `Payout for ${confirmAction.payout.user?.displayName} has been ${confirmAction.status}.`,
			})
			router.refresh()
		} else {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: result.error || 'Failed to update status.',
			})
		}
		setActionState({ isLoading: false, payoutId: null })
		setConfirmAction(null)
	}

	return (
		<>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Date Requested</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>
								<span className='sr-only'>Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payouts.map(payout => {
							const StatusIcon = statusIconMap[payout.status]
							const isLoading =
								actionState.isLoading && actionState.payoutId === payout.id
							return (
								<TableRow key={payout.id}>
									<TableCell>
										<div className='flex items-center gap-3'>
											<Avatar className='h-9 w-9'>
												<AvatarImage
													src={payout.user?.photoURL}
													alt={payout.user?.displayName}
												/>
												<AvatarFallback>
													{payout.user?.displayName?.charAt(0) ?? 'U'}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className='font-medium'>{payout.user?.displayName}</p>
												<p className='text-sm text-muted-foreground'>
													{payout.user?.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										{format(payout.requestedAt.toDate(), 'PPP')}
									</TableCell>
									<TableCell>
										<div className='flex flex-col'>
											<span className='font-semibold'>
												{payout.amountCurrency.toLocaleString('de-DE', {
													style: 'currency',
													currency: 'EUR',
												})}
											</span>
											<span className='text-xs text-muted-foreground flex items-center gap-1'>
												<CircleDollarSign className='h-3 w-3' />
												{payout.amountCredits.toLocaleString()}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={statusVariantMap[payout.status]}
											className='capitalize'
										>
											<StatusIcon
												className={`mr-1 h-3 w-3 ${payout.status === 'pending' && 'animate-spin'}`}
											/>
											{payout.status}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													aria-haspopup='true'
													size='icon'
													variant='ghost'
													disabled={isLoading}
												>
													{isLoading ? (
														<Loader2 className='h-4 w-4 animate-spin' />
													) : (
														<MoreHorizontal className='h-4 w-4' />
													)}
													<span className='sr-only'>Toggle menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													disabled={payout.status !== 'pending'}
													onSelect={() =>
														setConfirmAction({ payout, status: 'approved' })
													}
												>
													Approve
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={payout.status !== 'approved'}
													onSelect={() =>
														setConfirmAction({ payout, status: 'paid' })
													}
												>
													Mark as Paid
												</DropdownMenuItem>
												<DropdownMenuItem
													className='text-destructive focus:text-destructive'
													disabled={
														payout.status !== 'pending' &&
														payout.status !== 'approved'
													}
													onSelect={() =>
														setConfirmAction({ payout, status: 'rejected' })
													}
												>
													Reject
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</div>

			<AlertDialog
				open={!!confirmAction}
				onOpenChange={open => !open && setConfirmAction(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Action</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to{' '}
							<span className='font-bold uppercase'>{confirmAction?.status}</span>{' '}
							this payout request for{' '}
							<span className='font-bold'>
								{confirmAction?.payout.amountCurrency.toLocaleString('de-DE', {
									style: 'currency',
									currency: 'EUR',
								})}
							</span>
							?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleAction}
							className={
								confirmAction?.status === 'rejected'
									? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
									: ''
							}
						>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
