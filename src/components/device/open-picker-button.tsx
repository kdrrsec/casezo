"use client";

import { Smartphone } from "lucide-react";

import { useDevice } from "@/components/providers/device-provider";

/** Knop die de centrale toestelkiezer opent. */
export function OpenPickerButton({ className = "" }: { className?: string }) {
  const { device, openPicker } = useDevice();
  return (
    <button type="button" onClick={openPicker} className={className}>
      <Smartphone className="size-4" strokeWidth={2} aria-hidden />
      {device ? "Ander toestel kiezen" : "Kies je toestel"}
    </button>
  );
}
