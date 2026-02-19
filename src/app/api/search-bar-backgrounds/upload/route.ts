import { adminStorage } from '@/firebase/admin'
import { verifyAdmin } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
	const adminCheck = await verifyAdmin(request)
	if (adminCheck) return adminCheck

	if (!adminStorage) {
		return NextResponse.json(
			{ error: 'Firebase Admin Storage not initialized' },
			{ status: 503 },
		)
	}

	try {
		const formData = await request.formData()
		const file = formData.get('file')

		if (!file || !(file instanceof File)) {
			return NextResponse.json(
				{ error: 'No file provided. Send a file in the "file" field.' },
				{ status: 400 },
			)
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{
					error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
				},
				{ status: 400 },
			)
		}

		const fileName = `${Date.now()}-${file.name}`
		const filePath = `searchBarBackgrounds/${fileName}`

		const buffer = Buffer.from(await file.arrayBuffer())
		const bucket = adminStorage.bucket()
		const storageFile = bucket.file(filePath)

		await storageFile.save(buffer, {
			metadata: { contentType: file.type },
		})

		// Use signed URL - works regardless of bucket ACL/IAM; makePublic() can fail
		// when uniform bucket-level access is enabled on Firebase Storage
		const [imageUrl] = await storageFile.getSignedUrl({
			action: 'read',
			expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
		})

		return NextResponse.json({ imageUrl })
	} catch (err) {
		console.error('Search bar background upload error:', err)
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : 'Failed to upload image',
			},
			{ status: 500 },
		)
	}
}
