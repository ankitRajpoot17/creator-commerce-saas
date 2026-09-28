"use client";

import { useEffect } from "react";

type Props = {
  creatorId: string;
  type: "PROFILE_VIEW" | "LINK_CLICK" | "PRODUCT_VIEW" | "CHECKOUT_STARTED" | "SALE";
  path?: string;
  metadata?: Record<string, unknown>;
};

export default function AnalyticsTracker({ creatorId, type, path, metadata }: Props) {
  useEffect(() => {
    const key = "cc_analytics_session";
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    const payload = JSON.stringify({
      creatorId,
      type,
      path: path || window.location.pathname,
      referrer: document.referrer,
      sessionId,
      metadata,
    });
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [creatorId, type, path, metadata]);

  return null;
}
