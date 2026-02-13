import Stripe from 'stripe';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let stripeSecretKey: string | null = null;
let stripeInstance: Stripe | null = null;

async function getStripeSecretKey(): Promise<string> {
  if (stripeSecretKey) {
    return stripeSecretKey;
  }

  // For local dev, use .env file. For production, this will be undefined.
  if (process.env.STRIPE_SECRET_KEY) {
    stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    return stripeSecretKey;
  }

  // For production on App Hosting, fetch from Secret Manager.
  try {
    let projectId: string | undefined;
    // Firebase App Hosting automatically provides FIREBASE_CONFIG.
    if (process.env.FIREBASE_CONFIG) {
        try {
            projectId = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
        } catch (e) {
            console.error('Failed to parse FIREBASE_CONFIG:', e);
        }
    }

    if (!projectId) {
        throw new Error("Firebase project ID could not be determined from environment variables.");
    }
    
    const secretName = `projects/${projectId}/secrets/STRIPE_SECRET_KEY/versions/latest`;
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret payload is empty for ${secretName}.`);
    }
    stripeSecretKey = payload;
    return stripeSecretKey;
  } catch (error) {
    console.error('Failed to access secret from Secret Manager:', error);
    throw new Error(
      `STRIPE_SECRET_KEY could not be loaded. Ensure the App Hosting backend service account has the 'Secret Manager Secret Accessor' role for the secret.`
    );
  }
}

export async function getStripe(): Promise<Stripe> {
  if (stripeInstance) {
    return stripeInstance;
  }
  const key = await getStripeSecretKey();
  stripeInstance = new Stripe(key);
  return stripeInstance;
}
