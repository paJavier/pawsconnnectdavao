"use client";

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
    if (widgetIdRef.current !== null) return;

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
    let intervalId;
    let timeoutId;

    if (window.turnstile) {
      renderWidget();
    } else {
      intervalId = window.setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          window.clearInterval(intervalId);
          if (timeoutId) window.clearTimeout(timeoutId);
        }
      }, 200);

      timeoutId = window.setTimeout(() => {
        if (!window.turnstile) {
          onError?.("Captcha failed to load. Please refresh and try again.");
        }
      }, 8000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <div className={className}>
      {!ready ? (
        <div className="text-xs text-neutral-600">Loading captcha...</div>
      ) : null}
      <div ref={elRef} />
    </div>
  );
}
