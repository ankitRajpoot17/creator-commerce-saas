"use client";

import { useEffect, useState } from "react";
import AnalyticsTracker from "@/app/components/AnalyticsTracker";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }

export default function Checkout({ params }: { params: Promise<{ productId: string }> }) {
  const [productId,setProductId]=useState("");
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ params.then(p=>setProductId(p.productId)); },[params]);

  async function loadRazorpay(){
    if(window.Razorpay) return true;
    await new Promise<void>((resolve,reject)=>{
      const s=document.createElement("script"); s.src="https://checkout.razorpay.com/v1/checkout.js"; s.onload=()=>resolve(); s.onerror=()=>reject(new Error("Unable to load payment checkout.")); document.body.appendChild(s);
    });
    return Boolean(window.Razorpay);
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!productId) return;
    setBusy(true); setMessage("Creating secure payment...");
    try{
      const r=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,buyerEmail:email})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Checkout failed.");
      const payment=await fetch("/api/payments/razorpay/order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:data.order.id})});
      const paymentData=await payment.json();
      if(!payment.ok) throw new Error(paymentData.error||"Payment setup failed.");
      if(!paymentData.keyId) throw new Error("Razorpay is not configured yet. Add the Razorpay keys in your environment.");

      await loadRazorpay();
      if(!window.Razorpay) throw new Error("Payment checkout is unavailable.");
      const razorpayOrderId=paymentData.razorpayOrderId;
      const checkout=new window.Razorpay({
        key:paymentData.keyId,
        amount:paymentData.amount,
        currency:paymentData.currency,
        name:"Creator Commerce",
        description:"Creator product purchase",
        order_id:razorpayOrderId,
        prefill:{email},
        theme:{color:"#111111"},
        handler:async(response:Record<string,string>)=>{
          setMessage("Verifying payment...");
          const verify=await fetch("/api/payments/razorpay/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:data.order.id,razorpayOrderId,razorpayPaymentId:response.razorpay_payment_id,razorpaySignature:response.razorpay_signature})});
          const result=await verify.json();
          if(!verify.ok) { setMessage(result.error||"Payment verification failed."); return; }
          window.location.href="/purchase/success?orderId="+encodeURIComponent(data.order.id);
        },
        modal:{ondismiss:()=>setMessage("Payment cancelled. Your order remains pending.")},
      });
      checkout.open();
      setMessage("Complete the payment in the secure Razorpay window.");
    }catch(err){ setMessage(err instanceof Error?err.message:"Unable to start checkout."); }
    finally{ setBusy(false); }
  }

  return <><AnalyticsTracker creatorId="" type="CHECKOUT_STARTED" path={"/checkout/" + productId} /><main style={{minHeight:"100vh",padding:"70px 24px",background:"#f7f7f7"}}>
    <form onSubmit={submit} style={{maxWidth:520,margin:"auto",background:"#fff",padding:32,borderRadius:20}}>
      <a href="/">← Home</a><h1>Secure checkout</h1><p>Enter your email. You’ll be redirected to Razorpay to complete payment.</p>
      <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{width:"100%",padding:14,border:"1px solid #ddd",borderRadius:10}} />
      <button disabled={busy||!productId} style={{width:"100%",marginTop:14,padding:14,border:0,borderRadius:10,background:"#111",color:"#fff",fontWeight:700}}>{busy?"Preparing…":"Pay securely"}</button>
      {message&&<p style={{color:"#666"}}>{message}</p>}
    </form>
  </main>;
}