import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * URL browsers use to reach the bucket. In Docker MINIO_ENDPOINT is an
 * internal hostname (http://minio:9000) that only the app can resolve, so
 * links and presigned URLs must use the public one. MINIO_PUBLIC_ENDPOINT is
 * read at runtime; NEXT_PUBLIC_MINIO_ENDPOINT is kept for older setups.
 */
export function minioPublicEndpoint(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.MINIO_PUBLIC_ENDPOINT ||
    env.NEXT_PUBLIC_MINIO_ENDPOINT ||
    env.MINIO_ENDPOINT ||
    ""
  ).replace(/\/+$/, "");
}

function getStorageConfig() {
  const config = {
    endpoint: process.env.MINIO_ENDPOINT,
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET,
  };
  const missing = [
    ["MINIO_ENDPOINT", config.endpoint],
    ["MINIO_ACCESS_KEY", config.accessKeyId],
    ["MINIO_SECRET_KEY", config.secretAccessKey],
    ["MINIO_BUCKET", config.bucket],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`Object storage is not configured. Missing: ${missing.join(", ")}`);
  }
  return config as { endpoint: string; accessKeyId: string; secretAccessKey: string; bucket: string };
}

function createClient(endpoint: string) {
  const config = getStorageConfig();
  return new S3Client({
    endpoint,
    region: "us-east-1", // MinIO requires a region value; actual value doesn't matter
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // REQUIRED for MinIO — without this, SDK uses virtual-hosted-style which breaks
  });
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "";
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? "";
export const MINIO_PUBLIC_URL = minioPublicEndpoint();

function lazyClient(resolve: () => S3Client): S3Client {
  let client: S3Client | undefined;
  return new Proxy({} as S3Client, {
    get(_target, property) {
      client ??= resolve();
      const value = Reflect.get(client, property, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

/** Create clients only when storage is used; core CRM can start without file storage. */
export const minioClient = lazyClient(() => createClient(getStorageConfig().endpoint));

/**
 * For presigned URLs handed to browsers. A SigV4 signature covers the host,
 * so the URL must be signed for the endpoint the browser will call. Signing
 * makes no network request, so the app never has to reach this endpoint.
 */
export const minioPresignClient = MINIO_PUBLIC_URL === MINIO_ENDPOINT
  ? minioClient
  : lazyClient(() => createClient(MINIO_PUBLIC_URL));

/** Short-lived GET link for a private object. Hand it out only after an access check. */
export function presignGet(key: string, expiresIn = 300): Promise<string> {
  const { bucket } = getStorageConfig();
  return getSignedUrl(
    minioPresignClient,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}

/**
 * Short-lived PUT link. The Content-Type is part of the signature, so the
 * storage refuses an upload sent with any other type.
 */
export function presignPut(key: string, contentType: string, expiresIn = 600): Promise<string> {
  const { bucket } = getStorageConfig();
  return getSignedUrl(
    minioPresignClient,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn, signableHeaders: new Set(["content-type"]) },
  );
}
