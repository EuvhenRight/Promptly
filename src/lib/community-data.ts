export type CommunityMember = {
	uid: string
	displayName: string
	photoURL: string
	streak?: number
	isVerified?: boolean
}

export const COMMUNITY_STREAKS: CommunityMember[] = [
	{ uid: '1', displayName: 'Scottie', photoURL: 'https://picsum.photos/seed/s1/80/80', streak: 61 },
	{ uid: '2', displayName: 'MD Rotterdam', photoURL: 'https://picsum.photos/seed/s2/80/80', streak: 17 },
	{ uid: '3', displayName: 'FF', photoURL: 'https://picsum.photos/seed/s3/80/80', streak: 11 },
	{ uid: '4', displayName: '8ab53dd69c2', photoURL: 'https://picsum.photos/seed/s4/80/80', streak: 10 },
	{ uid: '5', displayName: 'haley3lizabeth', photoURL: 'https://picsum.photos/seed/s5/80/80', streak: 9 },
	{ uid: '6', displayName: 'HeroPro01', photoURL: 'https://picsum.photos/seed/s6/80/80', streak: 7 },
	{ uid: '7', displayName: 'PhoenixWarrior', photoURL: 'https://picsum.photos/seed/s7/80/80', streak: 4 },
	{ uid: '8', displayName: 'SlickRick56', photoURL: 'https://picsum.photos/seed/s8/80/80', streak: 2 },
	{ uid: '9', displayName: 'MKAOS', photoURL: 'https://picsum.photos/seed/s9/80/80', streak: 2 },
	{ uid: '10', displayName: 'annamgimani', photoURL: 'https://picsum.photos/seed/s10/80/80', streak: 2 },
	{ uid: '11', displayName: 'queensahiba53', photoURL: 'https://picsum.photos/seed/s11/80/80', streak: 2 },
	{ uid: '12', displayName: 'gatitosmp2', photoURL: 'https://picsum.photos/seed/s12/80/80', streak: 2 },
	{ uid: '13', displayName: 'ERH', photoURL: 'https://picsum.photos/seed/s13/80/80', streak: 2 },
	{ uid: '14', displayName: 'a7nazy2030', photoURL: 'https://picsum.photos/seed/s14/80/80', streak: 2 },
	{ uid: '15', displayName: 'Alexonder', photoURL: 'https://picsum.photos/seed/s15/80/80', streak: 2 },
	{ uid: '16', displayName: 'eliascamargo2006', photoURL: 'https://picsum.photos/seed/s16/80/80', streak: 1 },
	{ uid: '17', displayName: 'satreopalsen3', photoURL: 'https://picsum.photos/seed/s17/80/80', streak: 1 },
	{ uid: '18', displayName: 'anjonegro82', photoURL: 'https://picsum.photos/seed/s18/80/80', streak: 1 },
]

export const MEMBER_OF_THE_DAY: CommunityMember = {
	uid: '2',
	displayName: 'MD Rotterdam',
	photoURL: 'https://picsum.photos/seed/s2/120/120',
}

export const NEW_MEMBERS: CommunityMember[] = [
	{ uid: '19', displayName: 'maulanatriy', photoURL: 'https://picsum.photos/seed/n1/60/60' },
	{ uid: '20', displayName: 'chronoreactions', photoURL: 'https://picsum.photos/seed/n2/60/60' },
	{ uid: '21', displayName: 'douglasdesignerint', photoURL: 'https://picsum.photos/seed/n3/60/60' },
	{ uid: '22', displayName: 'tegin434', photoURL: 'https://picsum.photos/seed/n4/60/60' },
	{ uid: '23', displayName: 'deadalister', photoURL: 'https://picsum.photos/seed/n5/60/60' },
	{ uid: '24', displayName: 'ammuthangam337', photoURL: 'https://picsum.photos/seed/n6/60/60' },
	{ uid: '25', displayName: 'labgunmax', photoURL: 'https://picsum.photos/seed/n7/60/60' },
	{ uid: '26', displayName: 'kyeonjin102', photoURL: 'https://picsum.photos/seed/n8/60/60' },
	{ uid: '27', displayName: 'ct15680293979', photoURL: 'https://picsum.photos/seed/n9/60/60' },
	{ uid: '28', displayName: 'contatomurillocunha', photoURL: 'https://picsum.photos/seed/n10/60/60' },
]

export const VERIFIED_PROFILES: CommunityMember[] = [
	{ uid: '19', displayName: 'maulanatriy', photoURL: 'https://picsum.photos/seed/n1/60/60', isVerified: true },
	{ uid: '20', displayName: 'chronoreactions', photoURL: 'https://picsum.photos/seed/n2/60/60', isVerified: true },
	{ uid: '21', displayName: 'douglasdesignerint', photoURL: 'https://picsum.photos/seed/n3/60/60', isVerified: true },
	{ uid: '22', displayName: 'tegin434', photoURL: 'https://picsum.photos/seed/n4/60/60', isVerified: true },
	{ uid: '23', displayName: 'deadalister', photoURL: 'https://picsum.photos/seed/n5/60/60', isVerified: true },
]
