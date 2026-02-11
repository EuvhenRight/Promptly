export type CommunityMember = {
	uid: string
	displayName: string
	photoURL: string
	username: string
	streak?: number
	isVerified?: boolean
}

export const COMMUNITY_STREAKS: CommunityMember[] = [
	{ uid: '1', displayName: 'Scottie', username: 'scottie', photoURL: 'https://picsum.photos/seed/s1/80/80', streak: 61 },
	{ uid: '2', displayName: 'MD Rotterdam', username: 'mdrotterdam', photoURL: 'https://picsum.photos/seed/s2/80/80', streak: 17 },
	{ uid: '3', displayName: 'FF', username: 'ff', photoURL: 'https://picsum.photos/seed/s3/80/80', streak: 11 },
	{ uid: '4', displayName: '8ab53dd69c2', username: '8ab53dd69c2', photoURL: 'https://picsum.photos/seed/s4/80/80', streak: 10 },
	{ uid: '5', displayName: 'haley3lizabeth', username: 'haley3lizabeth', photoURL: 'https://picsum.photos/seed/s5/80/80', streak: 9 },
	{ uid: '6', displayName: 'HeroPro01', username: 'heropro01', photoURL: 'https://picsum.photos/seed/s6/80/80', streak: 7 },
	{ uid: '7', displayName: 'PhoenixWarrior', username: 'phoenixwarrior', photoURL: 'https://picsum.photos/seed/s7/80/80', streak: 4 },
	{ uid: '8', displayName: 'SlickRick56', username: 'slickrick56', photoURL: 'https://picsum.photos/seed/s8/80/80', streak: 2 },
	{ uid: '9', displayName: 'MKAOS', username: 'mkaos', photoURL: 'https://picsum.photos/seed/s9/80/80', streak: 2 },
	{ uid: '10', displayName: 'annamgimani', username: 'annamgimani', photoURL: 'https://picsum.photos/seed/s10/80/80', streak: 2 },
	{ uid: '11', displayName: 'queensahiba53', username: 'queensahiba53', photoURL: 'https://picsum.photos/seed/s11/80/80', streak: 2 },
	{ uid: '12', displayName: 'gatitosmp2', username: 'gatitosmp2', photoURL: 'https://picsum.photos/seed/s12/80/80', streak: 2 },
	{ uid: '13', displayName: 'ERH', username: 'erh', photoURL: 'https://picsum.photos/seed/s13/80/80', streak: 2 },
	{ uid: '14', displayName: 'a7nazy2030', username: 'a7nazy2030', photoURL: 'https://picsum.photos/seed/s14/80/80', streak: 2 },
	{ uid: '15', displayName: 'Alexonder', username: 'alexonder', photoURL: 'https://picsum.photos/seed/s15/80/80', streak: 2 },
	{ uid: '16', displayName: 'eliascamargo2006', username: 'eliascamargo2006', photoURL: 'https://picsum.photos/seed/s16/80/80', streak: 1 },
	{ uid: '17', displayName: 'satreopalsen3', username: 'satreopalsen3', photoURL: 'https://picsum.photos/seed/s17/80/80', streak: 1 },
	{ uid: '18', displayName: 'anjonegro82', username: 'anjonegro82', photoURL: 'https://picsum.photos/seed/s18/80/80', streak: 1 },
]

export const MEMBER_OF_THE_DAY: CommunityMember = {
	uid: '2',
	displayName: 'MD Rotterdam',
	username: 'mdrotterdam',
	photoURL: 'https://picsum.photos/seed/s2/120/120',
}

export const NEW_MEMBERS: CommunityMember[] = [
	{ uid: '19', displayName: 'maulanatriy', username: 'maulanatriy', photoURL: 'https://picsum.photos/seed/n1/60/60' },
	{ uid: '20', displayName: 'chronoreactions', username: 'chronoreactions', photoURL: 'https://picsum.photos/seed/n2/60/60' },
	{ uid: '21', displayName: 'douglasdesignerint', username: 'douglasdesignerint', photoURL: 'https://picsum.photos/seed/n3/60/60' },
	{ uid: '22', displayName: 'tegin434', username: 'tegin434', photoURL: 'https://picsum.photos/seed/n4/60/60' },
	{ uid: '23', displayName: 'deadalister', username: 'deadalister', photoURL: 'https://picsum.photos/seed/n5/60/60' },
	{ uid: '24', displayName: 'ammuthangam337', username: 'ammuthangam337', photoURL: 'https://picsum.photos/seed/n6/60/60' },
	{ uid: '25', displayName: 'labgunmax', username: 'labgunmax', photoURL: 'https://picsum.photos/seed/n7/60/60' },
	{ uid: '26', displayName: 'kyeonjin102', username: 'kyeonjin102', photoURL: 'https://picsum.photos/seed/n8/60/60' },
	{ uid: '27', displayName: 'ct15680293979', username: 'ct15680293979', photoURL: 'https://picsum.photos/seed/n9/60/60' },
	{ uid: '28', displayName: 'contatomurillocunha', username: 'contatomurillocunha', photoURL: 'https://picsum.photos/seed/n10/60/60' },
]

export const VERIFIED_PROFILES: CommunityMember[] = [
	{ uid: '19', displayName: 'maulanatriy', username: 'maulanatriy', photoURL: 'https://picsum.photos/seed/n1/60/60', isVerified: true },
	{ uid: '20', displayName: 'chronoreactions', username: 'chronoreactions', photoURL: 'https://picsum.photos/seed/n2/60/60', isVerified: true },
	{ uid: '21', displayName: 'douglasdesignerint', username: 'douglasdesignerint', photoURL: 'https://picsum.photos/seed/n3/60/60', isVerified: true },
	{ uid: '22', displayName: 'tegin434', username: 'tegin434', photoURL: 'https://picsum.photos/seed/n4/60/60', isVerified: true },
	{ uid: '23', displayName: 'deadalister', username: 'deadalister', photoURL: 'https://picsum.photos/seed/n5/60/60', isVerified: true },
]
