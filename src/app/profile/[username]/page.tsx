'use client'

// This page has been moved to /user/[username]
// This file is kept to avoid breaking changes but should not be used.
// You can safely remove it in the future.

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function OldProfilePage() {
	const router = useRouter()
	const params = useParams<{ username: string }>()

	useEffect(() => {
		if (params.username) {
			router.replace(`/user/${params.username}`)
		} else {
			router.replace('/')
		}
	}, [router, params.username])

	return null
}
