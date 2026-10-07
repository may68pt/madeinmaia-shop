import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { passwordResetTokens, userAccounts, userSessions } from "@/db/schema";
import { createSessionToken, hashPassword, hashSessionToken } from "@/lib/account-auth";

const RESET_LIFETIME=30*60*1000;
const GENERIC_MESSAGE="If an account exists for that email, a password reset link is on its way.";

function validOrigin(request:Request){
  const origin=request.headers.get("origin");
  if(!origin)return true;
  const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const publicHost=forwardedHost||request.headers.get("host")||new URL(request.url).host;
  try{return new URL(origin).host===publicHost;}catch{return false;}
}

function publicOrigin(request:Request){
  const configured=process.env.PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_SITE_URL;
  if(configured)return configured.replace(/\/$/,"");
  const protocol=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()||new URL(request.url).protocol.replace(":","");
  const host=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()||request.headers.get("host")||new URL(request.url).host;
  return `${protocol}://${host}`;
}

function escapeHtml(value:string){return value.replace(/[&<>'"]/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]??character);}

async function sendResetEmail(email:string,url:string){
  const apiKey=process.env.RESEND_API_KEY;
  const from=process.env.ORDER_FROM_EMAIL;
  if(!apiKey||!from)return;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[email],subject:"Reset your Made in Maia password",html:`<div style="background:#0d0d0c;color:#f4f3ef;font-family:Arial,sans-serif;margin:auto;max-width:600px;padding:32px"><h1 style="text-transform:uppercase">Made in Maia</h1><p>We received a request to reset your password.</p><p><a href="${escapeHtml(url)}" style="background:#ff4b22;color:#fff;display:inline-block;font-weight:700;padding:14px 20px;text-decoration:none;text-transform:uppercase">Choose a new password</a></p><p style="color:#aaa">This link expires in 30 minutes and can only be used once. If you did not request it, you can ignore this email.</p></div>`})});
  if(!response.ok)throw new Error(`Email provider returned ${response.status}`);
}

export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:"Invalid origin"},{status:403});
  const body=await request.json().catch(()=>null) as {action?:string;email?:string;token?:string;password?:string}|null;
  const db=getDb();

  if(body?.action==="request"){
    const email=String(body.email??"").trim().toLowerCase().slice(0,254);
    if(!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({message:GENERIC_MESSAGE});
    const [user]=await db.select({id:userAccounts.id,email:userAccounts.email}).from(userAccounts).where(eq(userAccounts.email,email)).limit(1);
    if(user){
      const token=createSessionToken();
      await db.transaction(async(transaction)=>{
        await transaction.delete(passwordResetTokens).where(eq(passwordResetTokens.userId,user.id));
        await transaction.insert(passwordResetTokens).values({tokenHash:hashSessionToken(token),userId:user.id,expiresAt:new Date(Date.now()+RESET_LIFETIME)});
      });
      try{await sendResetEmail(user.email,`${publicOrigin(request)}/conta/repor?token=${encodeURIComponent(token)}`);}catch{/* Keep the response indistinguishable to prevent account enumeration. */}
    }
    return NextResponse.json({message:GENERIC_MESSAGE});
  }

  if(body?.action==="reset"){
    const token=String(body.token??"");
    const password=String(body.password??"");
    if(token.length<32||password.length<10||password.length>128)return NextResponse.json({error:"This reset link is invalid or expired."},{status:400});
    const [reset]=await db.select({id:passwordResetTokens.id,userId:passwordResetTokens.userId}).from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash,hashSessionToken(token)),gt(passwordResetTokens.expiresAt,new Date()),isNull(passwordResetTokens.usedAt))).limit(1);
    if(!reset)return NextResponse.json({error:"This reset link is invalid or expired."},{status:400});
    const passwordHash=await hashPassword(password);
    await db.transaction(async(transaction)=>{
      await transaction.update(userAccounts).set({passwordHash}).where(eq(userAccounts.id,reset.userId));
      await transaction.update(passwordResetTokens).set({usedAt:new Date()}).where(eq(passwordResetTokens.id,reset.id));
      await transaction.delete(userSessions).where(eq(userSessions.userId,reset.userId));
    });
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"Invalid action"},{status:400});
}
