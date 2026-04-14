"use client";

import { useLayoutEffect } from "react";

export function LangSetter({ locale }: { locale: string }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
