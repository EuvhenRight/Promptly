import Replicate from 'replicate';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let replicateApiToken: string | null = null;
let replicateInstance: Replicate | null = null;

/**
 * Retrieves the Replicate API token, from either the local .env file or Google Secret Manager.
 * Caches the token after the first successful retrieval.
 */
async function getReplicateApiToken(): Promise<string> {
  if (replicateApiToken) {
    return replicateApiToken;
  }

  // For local dev, use .env file.
  if (process.env.REPLICATE_API_TOKEN) {
    replicateApiToken = process.env.REPLICATE_API_TOKEN;
    return replicateApiToken;
  }

  // For production on App Hosting, fetch from Secret Manager.
  try {
    let projectId: string | undefined;
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
    
    const secretName = `projects/${projectId}/secrets/REPLICATE_API_TOKEN/versions/latest`;
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString();

    if (!payload) {
      throw new Error(`Secret payload is empty for ${secretName}. This is the most likely cause of the "Server Components render" error in production.`);
    }

    replicateApiToken = payload;
    return replicateApiToken;
  } catch (error) {
    console.error('Failed to access Replicate secret from Secret Manager:', error);
    throw new Error(
      `REPLICATE_API_TOKEN could not be loaded. Ensure the secret exists and the App Hosting backend service account has the 'Secret Manager Secret Accessor' role for it.`
    );
  }
}

/**
 * Returns a pre-configured instance of the Replicate client.
 */
export async function getReplicateClient(): Promise<Replicate> {
  if (replicateInstance) {
    return replicateInstance;
  }
  const token = await getReplicateApiToken();
  replicateInstance = new Replicate({ auth: token });
  return replicateInstance;
}
