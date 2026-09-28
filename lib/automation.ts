import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/integration-crypto";
import { sendEmail } from "@/lib/email";

export type AutomationEvent={creatorId:string;type:string;payload:Record<string,unknown>};
const get=(obj:Record<string,unknown>,path:string)=>path.split(".").reduce<unknown>((v,k)=>v&&typeof v==="object"?(v as Record<string,unknown>)[k]:undefined,obj);
export function template(value:unknown,payload:Record<string,unknown>):unknown {
  if(typeof value!=="string") return value;
  const exact=value.match(/^\{\{\s*([^}]+)\s*\}\}$/);
  if(exact) return get(payload,exact[1].trim()) ?? "";
  return value.replace(/\{\{\s*([^}]+)\s*\}\}/g,(_,p)=>String(get(payload,String(p).trim())??""));
}
function matches(conditions:unknown,payload:Record<string,unknown>) {
  if(!conditions || typeof conditions!=="object") return true;
  return Object.entries(conditions as Record<string,unknown>).every(([k,v])=>String(get(payload,k)??"")===String(v));
}
async function postJson(url:string,body:unknown,secret?:string) {
  const raw=JSON.stringify(body);
  const headers:Record<string,string>={"content-type":"application/json","user-agent":"CreatorCommerce-Automation/1.0"};
  if(secret) headers["x-creator-commerce-signature"]="sha256="+crypto.createHmac("sha256",secret).update(raw).digest("hex");
  const res=await fetch(url,{method:"POST",headers,body:raw,signal:AbortSignal.timeout(15000)});
  if(!res.ok) throw new Error("HTTP "+res.status);
  return res.status;
}
async function refreshGoogleAccessToken(credentials:Record<string,any>) {
  if (credentials.accessToken && Number(credentials.expiresAt||0)>Date.now()+60000) return credentials;
  if (!credentials.refreshToken || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return credentials;
  const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:String(credentials.refreshToken),grant_type:"refresh_token"})});
  if(!res.ok) throw new Error("Google token refresh failed");
  const token=await res.json();
  return {...credentials,accessToken:token.access_token,expiresAt:Date.now()+Number(token.expires_in||3600)*1000};
}
async function execute(step:{id:string;action:string;config:unknown},connection:{provider:string;credentials:string}|null,payload:Record<string,unknown>) {
  const c=(step.config||{}) as Record<string,unknown>;
  const provider=connection?.provider;
  let credentials=connection?.credentials?decryptJson<Record<string,any>>(connection.credentials):{};
  if(provider==="GOOGLE_SHEETS") credentials=await refreshGoogleAccessToken(credentials);
  const url=String(c.url||credentials.webhookUrl||"");
  switch(step.action){
    case "WEBHOOK_POST":
      if(!url) throw new Error("Webhook URL is required");
      return postJson(url,payload,typeof c.secret==="string"?c.secret:undefined);
    case "SLACK_WEBHOOK":
      if(!url) throw new Error("Slack webhook URL is required");
      return postJson(url,{text:String(template(c.message||"{{event.type}}",payload))});
    case "DISCORD_WEBHOOK":
      if(!url) throw new Error("Discord webhook URL is required");
      return postJson(url,{content:String(template(c.message||"{{event.type}}",payload))});
    case "TELEGRAM_SEND": {
      const token=String(c.botToken||credentials.botToken||""); const chatId=String(c.chatId||credentials.chatId||"");
      if(!token||!chatId) throw new Error("Telegram bot token and chat id are required");
      const res=await fetch("https://api.telegram.org/bot"+encodeURIComponent(token)+"/sendMessage",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text:String(template(c.message||"{{event.type}}",payload))})});
      if(!res.ok) throw new Error("Telegram HTTP "+res.status); return res.status;
    }
    case "GOOGLE_SHEETS_APPEND": {
      if(provider!=="GOOGLE_SHEETS") throw new Error("Google Sheets connection required");
      const token=String(credentials.accessToken||""); const spreadsheetId=String(c.spreadsheetId||""); const range=String(c.range||"Sheet1!A:Z");
      const values=Array.isArray(c.columns)?c.columns.map(v=>template(v,payload)):[];
      if(!token||!spreadsheetId||!values.length) throw new Error("Google Sheets token, spreadsheetId and columns are required");
      const res=await fetch("https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(spreadsheetId)+"/values/"+encodeURIComponent(range)+":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS",{method:"POST",headers:{Authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({values:[values]})});
      if(!res.ok) throw new Error("Google Sheets HTTP "+res.status); return res.status;
    }
    case "EMAIL_SEND": {
      const to=String(template(c.to||payload.email,payload)); if(!to) throw new Error("Email recipient is required");
      const sent=await sendEmail({to,subject:String(template(c.subject||"Automation",payload)),html:String(template(c.html||c.message||"",payload))});
      if(!sent.sent) throw new Error(sent.error||"Email failed"); return 200;
    }
    default: throw new Error("Unsupported automation action: "+step.action);
  }
}
export async function emitAutomationEvent(event:AutomationEvent) {
  const automations=await prisma.automation.findMany({where:{creatorId:event.creatorId,status:"ACTIVE",trigger:event.type},include:{steps:{where:{enabled:true},orderBy:{position:"asc"}},connection:true}});
  for(const automation of automations) {
    if(!matches(automation.conditions,event.payload)) continue;
    for(const step of automation.steps) {
      try {
        const status=await execute(step,automation.connection,event.payload);
        await prisma.integrationDeliveryLog.create({data:{creatorId:event.creatorId,automationId:automation.id,stepId:step.id,provider:automation.connection?.provider||step.action,eventType:event.type,status:"SUCCESS",responseStatus:status}});
      } catch(e) {
        await prisma.integrationDeliveryLog.create({data:{creatorId:event.creatorId,automationId:automation.id,stepId:step.id,provider:automation.connection?.provider||step.action,eventType:event.type,status:"FAILED",error:e instanceof Error?e.message:"Automation failed"}});
      }
    }
  }
}
