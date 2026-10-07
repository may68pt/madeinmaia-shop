import { NextResponse } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, userAccounts, userSessions } from "@/db/schema";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "@/lib/account-auth";

const COOKIE="mim_session";
function validOrigin(request:Request){
  const origin=request.headers.get("origin");
  if(!origin)return true;
  const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const publicHost=forwardedHost||request.headers.get("host")||new URL(request.url).host;
  try{return new URL(origin).host===publicHost;}catch{return false;}
}
function sessionToken(request:Request){const value=request.headers.get("cookie")?.match(/(?:^|; )mim_session=([^;]+)/)?.[1];return value?decodeURIComponent(value):null;}

export async function GET(request:Request){
  const token=sessionToken(request);
  if(!token)return NextResponse.json({user:null,orders:[]});
  try {
    const db=getDb();
    const [user]=await db.select({email:userAccounts.email,role:userAccounts.role}).from(userSessions).innerJoin(userAccounts,eq(userAccounts.id,userSessions.userId)).where(and(eq(userSessions.tokenHash,hashSessionToken(token)),gt(userSessions.expiresAt,new Date()))).limit(1);
    if(!user)return NextResponse.json({user:null,orders:[]});
    const orderList=await db.select({reference:orders.reference,status:orders.status,items:orders.items,shippingCents:orders.shippingCents,totalCents:orders.totalCents,trackingCode:orders.trackingCode,trackingUrl:orders.trackingUrl,createdAt:orders.createdAt}).from(orders).where(sql`lower(${orders.customerEmail}) = ${user.email}`).orderBy(desc(orders.createdAt));
    return NextResponse.json({user,orders:orderList});
  } catch {
    return NextResponse.json({error:"Could not load your account."},{status:503});
  }
}

export async function DELETE(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:"Invalid origin"},{status:403});
  const token=sessionToken(request);
  if(!token)return NextResponse.json({error:"Authentication required"},{status:401});
  const db=getDb();
  const [session]=await db.select({userId:userSessions.userId}).from(userSessions).where(and(eq(userSessions.tokenHash,hashSessionToken(token)),gt(userSessions.expiresAt,new Date()))).limit(1);
  if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
  await db.transaction(async(transaction)=>{
    await transaction.delete(userSessions).where(eq(userSessions.userId,session.userId));
    await transaction.delete(userAccounts).where(eq(userAccounts.id,session.userId));
  });
  const response=NextResponse.json({ok:true});
  response.cookies.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
  return response;
}

export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:"Invalid origin"},{status:403});
  const body=await request.json().catch(()=>null) as {action?:string;email?:string;password?:string}|null;
  const action=body?.action;
  const email=String(body?.email??"").trim().toLowerCase().slice(0,254);
  const password=String(body?.password??"");
  const db=getDb();
  if(action==="logout"){
    const token=sessionToken(request);
    if(token)await db.delete(userSessions).where(eq(userSessions.tokenHash,hashSessionToken(token)));
    const response=NextResponse.json({ok:true});
    response.cookies.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
    return response;
  }
  if(!/^\S+@\S+\.\S+$/.test(email)||password.length<10||password.length>128)return NextResponse.json({error:"Use a valid email and a password with at least 10 characters."},{status:400});
  let user;
  if(action==="signup"){
    const passwordHash=await hashPassword(password);
    try{[user]=await db.insert(userAccounts).values({email,passwordHash}).returning({id:userAccounts.id,email:userAccounts.email,role:userAccounts.role});}catch{return NextResponse.json({error:"This email already has an account."},{status:409});}
  }else if(action==="login"){
    const [stored]=await db.select().from(userAccounts).where(eq(userAccounts.email,email)).limit(1);
    if(!stored||!(await verifyPassword(password,stored.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});
    user={id:stored.id,email:stored.email,role:stored.role};
  }else return NextResponse.json({error:"Invalid action"},{status:400});
  const token=createSessionToken();
  const expiresAt=new Date(Date.now()+30*24*60*60*1000);
  await db.insert(userSessions).values({tokenHash:hashSessionToken(token),userId:user.id,expiresAt});
  const response=NextResponse.json({user:{email:user.email,role:user.role}});
  response.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",expires:expiresAt});
  return response;
}
