// Cloudflare R2 Storage Configuration
// Add your R2 credentials to .env.local:
// R2_ACCOUNT_ID=your_account_id
// R2_ACCESS_KEY_ID=your_access_key_id
// R2_SECRET_ACCESS_KEY=your_secret_access_key
// R2_BUCKET_NAME=your_bucket_name
// R2_PUBLIC_URL=https://your-domain.com (optional, for custom domain)

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'R2 credentials not configured. Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME to your .env.local file'
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}

export function getR2Endpoint(config: R2Config): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com`;
}

export function getR2PublicUrl(config: R2Config, storageId: string): string {
  if (config.publicUrl) {
    return `${config.publicUrl}/${storageId}`;
  }
  return `https://${config.bucketName}.${config.accountId}.r2.dev/${storageId}`;
}
