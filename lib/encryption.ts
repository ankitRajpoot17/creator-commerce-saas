import crypto from "crypto";

function key(){
 const raw=process.env.COMMUNITY_ENCRYPTION_KEY;
 if(!raw)throw new Error("COMMUNITY_ENCRYPTION_KEY is not configured.");
 const decoded=Buffer.from(raw,"base64");
 if(decoded.length!==32)throw new Error("COMMUNITY_ENCRYPTION_KEY must be base64-encoded 32 bytes.");
 return decoded;
}
export function encryptSecret(value:string){
 const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
 const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
 return iv.toString("base64")+":"+cipher.getAuthTag().toString("base64")+":"+encrypted.toString("base64");
}
export function decryptSecret(payload:string){
 const [ivText,tagText,dataText]=payload.split(":");
 if(!ivText||!tagText||!dataText)throw new Error("Invalid encrypted secret.");
 const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(ivText,"base64"));
 decipher.setAuthTag(Buffer.from(tagText,"base64"));
 return Buffer.concat([decipher.update(Buffer.from(dataText,"base64")),decipher.final()]).toString("utf8");
}
