const admin = require('firebase-admin');
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Список UID всіх розробників (твій та твоїх друзів)
const adminUids = [
  '41FOJWJZZhV3SEKtAx1gIWXYMPQ2',
  'rNDYOUxEpwhnN5NfKLkS6uk0Y0z1',
  'sOabeHLWOQZDXwKZX9rBGMxj9Hd2',
  '14mi6ehDyAN9jgjxiG8ageZhcSq2'
];

async function makeAdmins(uids) {
  for (const uid of uids) {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      console.log(`Success: User ${uid} is now an Admin`);
    } catch (error) {
      console.error(`Error setting admin for ${uid}:`, error);
    }
  }
  process.exit();
}

makeAdmins(adminUids);
