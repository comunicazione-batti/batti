"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

let externalSetter: ((msg: string) => void) | null = null;

export function toast(message: string) {
  externalSetter?.(message);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    externalSetter = (m: string) => {
      setMsg(m);
      window.setTimeout(() => setMsg(null), 2600);
    };
    return () => {
      externalSetter = null;
    };
  }, []);

  if (!mounted) return null;
  const host = document.getElementById("toast-root");
  if (!host || !msg) return null;

  return createPortal(<div className="toast">{msg}</div>, host);
}
