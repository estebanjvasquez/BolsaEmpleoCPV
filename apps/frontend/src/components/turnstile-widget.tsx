"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
    };
  }
}

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    function renderWidget() {
      if (!containerRef.current || !window.turnstile || renderedRef.current) return;
      renderedRef.current = true;
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": () => onVerify(""),
      });
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        renderWidget();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [siteKey, onVerify]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div ref={containerRef} />
    </>
  );
}
