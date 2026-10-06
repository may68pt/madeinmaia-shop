import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt=promisify(scryptCallback);
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex");const derived=await scrypt(password,salt,64) as Buffer;return `${salt}:${derived.toString("hex")}`;}
export async function verifyPassword(password:string,stored:string){const [salt,hex]=stored.split(":");if(!salt||!hex)return false;const expected=Buffer.from(hex,"hex");const derived=await scrypt(password,salt,expected.length) as Buffer;return expected.length===derived.length&&timingSafeEqual(expected,derived);}
export function createSessionToken(){return randomBytes(32).toString("base64url");}
export function hashSessionToken(token:string){return createHash("sha256").update(token).digest("hex");}
