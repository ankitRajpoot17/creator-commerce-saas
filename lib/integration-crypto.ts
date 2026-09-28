import crypto from "crypto";

function key() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.COMMUNITY_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!raw) throw new Error("INTEGRATION_ENCRYPTION_KEY is required");
  return crypto.createHash("sha256").update(raw).digest();
}
export function encryptJson(value: unknown) {
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  const tag=cipher.getAuthTag();
  return ["v1",iv.toString("base64url"),tag.toString("base64url"),ciphertext.toString("base64url")].join(".");
}
export function decryptJson<T=Record<string,unknown>>(value:string): T {
  const [version,ivB64,tagB64,dataB64]=value.split(".");
  if(version!=="v1"||!ivB64||!tagB64||!dataB64) throw new Error("Invalid encrypted credential");
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(ivB64,"base64url"));
  decipher.setAuthTag(Buffer.from(tagB64,"base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(dataB64,"base64url")),decipher.final()]).toString("utf8")) as T;
}
