type SendEmailInput={to:string;subject:string;html:string;from?:string};

export async function sendEmail({to,subject,html,from}:SendEmailInput){
 const key=process.env.RESEND_API_KEY;
 if(!key) return {sent:false,reason:"RESEND_API_KEY is not configured."};
 const sender=from||process.env.RESEND_FROM_EMAIL||"Creator Commerce <onboarding@resend.dev>";
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:sender,to:[to],subject,html})});
 if(!response.ok) throw new Error("EMAIL_SEND_FAILED");
 return {sent:true,data:await response.json()};
}

export function renderEmailBody(body:string,name?:string){
 return body.replaceAll("{{name}}",name||"there").replaceAll("{{email}}", "");
}
