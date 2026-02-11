const admin = require('firebase-admin');
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// List of UIDs for all developers (you and your friends)
const adminUids = [
  '41FOJWJZZhV3SEKtAx1gIWXYMPQ2',
  'rNDYOUxEpwhnN5NfKLkS6uk0Y0z1',
  'sOabeHLWOQZDXwKZX9rBGMxj9Hd2',
  '14mi6ehDyAN9jgjxiG8ageZhcSq2'
];

async function makeAdmins(uids) {
  const firestore = admin.firestore();
  for (const uid of uids) {
    try {
      // Set the custom claim for auth rules to use
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      
      // Also update the user's document in Firestore for client-side checks
      const userRef = firestore.collection('users').doc(uid);
      await userRef.update({ role: 'admin' });
      
      console.log(`Success: User ${uid} is now an Admin in both Auth and Firestore.`);
    } catch (error) {
      console.error(`Error setting admin for ${uid}:`, error);
    }
  }
  process.exit();
}

makeAdmins(adminUids);
