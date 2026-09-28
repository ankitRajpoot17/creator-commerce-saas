export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}
export function isValidEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());}
export function isNonNegativeInteger(value:unknown){return Number.isInteger(Number(value))&&Number(value)>=0;}
export function clampText(value:unknown,max=500){return String(value??"").trim().slice(0,max);}
export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
