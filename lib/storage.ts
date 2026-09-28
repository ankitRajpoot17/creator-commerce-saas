import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function client() {
  if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) throw new Error("Private storage is not configured.");
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY }
  });
}

export function storageConfigured() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

export function createPrivateFileKey(creatorId: string, productId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "file";
  return `creators/${creatorId}/products/${productId}/${randomUUID()}-${safe}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, ContentType: contentType || "application/octet-stream" });
  return getSignedUrl(client(), command, { expiresIn: 900 });
}

export function createUploadToken(userId: string, productId: string) {
  return createPrivateFileKey(userId, productId, "legacy");
}

export function verifyUploadToken(_token: string, _userId: string, _productId: string) {
  return false;
}

export function createSignedDownloadUrl(fileUrl: string) {
  return fileUrl;
}

export function verifySignedDownload(_orderId: string, _expires: string, _signature: string) {
  return false;
}

export async function createPrivateDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key });
  return getSignedUrl(client(), command, { expiresIn: 900 });
}
