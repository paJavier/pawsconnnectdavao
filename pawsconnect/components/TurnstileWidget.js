"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export default function TurnstileWidget({
  onToken,
  onExpire,
  onError,
  className = "",
}) {
  const elRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [ready, setReady] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = () => {
    if (!siteKey) {
      onError?.("Turnstile site key missing.");
      return;
    }
    if (!window.turnstile || !elRef.current) return;
    if (widgetIdRef.current !== null) return; // prevent double render

    widgetIdRef.current = window.turnstile.render(elRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => onToken?.(token),
      "expired-callback": () => onExpire?.(),
      "error-callback": () => onError?.("Captcha failed to load. Please refresh and try again."),
    });

    setReady(true);
  };

  useEffect(() => {
    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      {!ready ? (
        <div className="text-xs text-neutral-600">Loading captcha…</div>
      ) : null}
      <div ref={elRef} />
    </div>
  );
}