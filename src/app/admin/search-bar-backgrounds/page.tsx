'use client'

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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Pencil, PlusCircle, Star, Trash } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type SearchBarBackgroundItem = {
	id: string
	imageUrl: string
	name: string
	isActive: boolean
	createdAt: string | null
}

export default function AdminSearchBarBackgroundsPage() {
	const { toast } = useToast()
	const [backgrounds, setBackgrounds] = useState<SearchBarBackgroundItem[]>([])
	const [loading, setLoading] = useState(true)
	const [newName, setNewName] = useState('')
	const [newFile, setNewFile] = useState<File | null>(null)
	const [newIsActive, setNewIsActive] = useState(false)
	const [adding, setAdding] = useState(false)
	const [editItem, setEditItem] = useState<SearchBarBackgroundItem | null>(null)
	const [editName, setEditName] = useState('')
	const [editFile, setEditFile] = useState<File | null>(null)
	const [editIsActive, setEditIsActive] = useState(false)
	const [savingEdit, setSavingEdit] = useState(false)
	const [deleteItem, setDeleteItem] = useState<SearchBarBackgroundItem | null>(
		null,
	)
	const [deleting, setDeleting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const editFileInputRef = useRef<HTMLInputElement>(null)

	const fetchBackgrounds = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/search-bar-backgrounds')
			const data = await res.json()
			setBackgrounds(Array.isArray(data) ? data : [])
		} catch {
			setBackgrounds([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchBackgrounds()
	}, [])

	async function uploadFileViaApi(file: File): Promise<string> {
		const formData = new FormData()
		formData.append('file', file)
		const res = await fetch('/api/search-bar-backgrounds/upload', {
			method: 'POST',
			body: formData,
		})
		const data = await res.json()
		if (!res.ok) throw new Error(data.error || 'Upload failed')
		return data.imageUrl
	}

	const handleCreate = async () => {
		if (!newFile) {
			toast({
				variant: 'destructive',
				title: 'Image required',
				description: 'Please select an image to upload.',
			})
			return
		}
		setAdding(true)
		try {
			const imageUrl = await uploadFileViaApi(newFile)
			const res = await fetch('/api/search-bar-backgrounds', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					imageUrl,
					name: newName.trim() || 'Untitled',
					isActive: newIsActive,
				}),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to create')
			toast({ title: 'Background created', description: data.name ?? newName })
			setNewName('')
			setNewFile(null)
			setNewIsActive(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
			fetchBackgrounds()
		} catch (e) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description:
					e instanceof Error ? e.message : 'Failed to create background.',
			})
		} finally {
			setAdding(false)
		}
	}

	const handleUpdate = async () => {
		if (!editItem) return
		const name = editName.trim() || 'Untitled'
		setSavingEdit(true)
		try {
			let imageUrl = editItem.imageUrl
			if (editFile) {
				imageUrl = await uploadFileViaApi(editFile)
			}
			const res = await fetch(`/api/search-bar-backgrounds/${editItem.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageUrl, name, isActive: editIsActive }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to update')
			toast({ title: 'Background updated', description: name })
			setEditItem(null)
			setEditName('')
			setEditFile(null)
			if (editFileInputRef.current) editFileInputRef.current.value = ''
			fetchBackgrounds()
		} catch (e) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description:
					e instanceof Error ? e.message : 'Failed to update background.',
			})
		} finally {
			setSavingEdit(false)
		}
	}

	const handleDelete = async () => {
		if (!deleteItem) return
		setDeleting(true)
		try {
			const res = await fetch(`/api/search-bar-backgrounds/${deleteItem.id}`, {
				method: 'DELETE',
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || 'Failed to delete')
			toast({ title: 'Background deleted', description: deleteItem.name })
			setDeleteItem(null)
			fetchBackgrounds()
		} catch (e) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description:
					e instanceof Error ? e.message : 'Failed to delete background.',
			})
		} finally {
			setDeleting(false)
		}
	}

	const handleSetActive = async (item: SearchBarBackgroundItem) => {
		if (item.isActive) return
		try {
			const res = await fetch(`/api/search-bar-backgrounds/${item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: true }),
			})
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error || 'Failed to set active')
			}
			toast({ title: 'Active background updated', description: item.name })
			fetchBackgrounds()
		} catch (e) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description:
					e instanceof Error ? e.message : 'Failed to set active background.',
			})
		}
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between gap-4'>
				<h1 className='text-lg font-semibold md:text-2xl'>
					Search Bar Background
				</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add background</CardTitle>
					<CardDescription>
						Upload an image to display behind the search bar on the home page.
						One background can be active at a time.
					</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-wrap items-end gap-4'>
					<div className='space-y-2'>
						<Label htmlFor='new-file'>Image</Label>
						<Input
							id='new-file'
							ref={fileInputRef}
							type='file'
							accept='image/png,image/jpeg,image/gif,image/webp'
							onChange={e => setNewFile(e.target.files?.[0] ?? null)}
							disabled={adding}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='new-name'>Name</Label>
						<Input
							id='new-name'
							placeholder='e.g. Abstract Art'
							value={newName}
							onChange={e => setNewName(e.target.value)}
							disabled={adding}
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Button
							variant={newIsActive ? 'default' : 'outline'}
							size='sm'
							onClick={() => setNewIsActive(!newIsActive)}
							disabled={adding}
						>
							<Star className='mr-1 h-4 w-4' />
							Set as active
						</Button>
					</div>
					<Button onClick={handleCreate} disabled={adding || !newFile}>
						{adding && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						<PlusCircle className='mr-2 h-4 w-4' />
						Add
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>All backgrounds</CardTitle>
					<CardDescription>
						The active background is shown behind the search bar. Set active to
						change which image is displayed.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='flex justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
						</div>
					) : backgrounds.length === 0 ? (
						<p className='py-4 text-muted-foreground'>
							No backgrounds yet. Add one above.
						</p>
					) : (
						<div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
							{backgrounds.map(bg => (
								<div
									key={bg.id}
									className='group relative overflow-hidden rounded-lg border bg-muted'
								>
									<div className='relative aspect-[2/1] w-full'>
										<Image
											src={bg.imageUrl}
											alt={bg.name}
											fill
											className='object-cover'
											sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
										/>
										{bg.isActive && (
											<div className='absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'>
												Active
											</div>
										)}
										<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
											<Button
												variant='secondary'
												size='sm'
												onClick={() => handleSetActive(bg)}
												disabled={bg.isActive}
											>
												<Star className='mr-1 h-4 w-4' />
												{bg.isActive ? 'Active' : 'Set active'}
											</Button>
											<Button
												variant='secondary'
												size='sm'
												onClick={() => {
													setEditItem(bg)
													setEditName(bg.name)
													setEditIsActive(bg.isActive)
													setEditFile(null)
												}}
											>
												<Pencil className='h-4 w-4' />
											</Button>
											<Button
												variant='destructive'
												size='sm'
												onClick={() => setDeleteItem(bg)}
											>
												<Trash className='h-4 w-4' />
											</Button>
										</div>
									</div>
									<div className='p-2'>
										<p className='truncate text-sm font-medium'>{bg.name}</p>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={!!editItem}
				onOpenChange={open => !open && setEditItem(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit background</DialogTitle>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label>Replace image (optional)</Label>
							<Input
								ref={editFileInputRef}
								type='file'
								accept='image/png,image/jpeg,image/gif,image/webp'
								onChange={e => setEditFile(e.target.files?.[0] ?? null)}
								disabled={savingEdit}
							/>
							{editItem && !editFile && (
								<div className='relative h-24 w-full overflow-hidden rounded border'>
									<Image
										src={editItem.imageUrl}
										alt={editItem.name}
										fill
										className='object-cover'
									/>
								</div>
							)}
						</div>
						<div className='space-y-2'>
							<Label>Name</Label>
							<Input
								value={editName}
								onChange={e => setEditName(e.target.value)}
								disabled={savingEdit}
								placeholder='Background name'
							/>
						</div>
						<div className='flex items-center gap-2'>
							<Button
								variant={editIsActive ? 'default' : 'outline'}
								size='sm'
								onClick={() => setEditIsActive(!editIsActive)}
								disabled={savingEdit}
							>
								<Star className='mr-1 h-4 w-4' />
								Set as active
							</Button>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setEditItem(null)}
							disabled={savingEdit}
						>
							Cancel
						</Button>
						<Button onClick={handleUpdate} disabled={savingEdit}>
							{savingEdit && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={!!deleteItem}
				onOpenChange={open => !open && setDeleteItem(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete background?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove &quot;{deleteItem?.name}&quot;. The image will no
							longer appear in the list.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleting}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{deleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
