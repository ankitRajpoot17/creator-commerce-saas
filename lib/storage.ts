import crypto from "crypto";

export function createUploadToken(userId: string, productId: string) {
  const secret = process.env.S3_SECRET_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Storage secret is not configured.");
  const payload = userId + ":" + productId + ":" + Date.now();
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(payload + ":" + signature).toString("base64url");
}

export function verifyUploadToken(token: string, userId: string, productId: string) {
  const secret = process.env.S3_SECRET_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(":");
    if (parts.length !== 4 || parts[0] !== userId || parts[1] !== productId) return false;
    const timestamp = Number(parts[2]);
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) return false;
    const expected = crypto.createHmac("sha256", secret).update(parts.slice(0, 3).join(":")).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expected));
  } catch {
    return false;
  }
}
