"use client";

import { Check, Smartphone } from "lucide-react";

import { useDevice } from "@/components/providers/device-provider";

/** Zet het toestel van de huidige pagina als "mijn toestel". */
export function SaveDeviceButton({ deviceId, name }: { deviceId: string; name: string }) {
  const { device, setDevice } = useDevice();
  if (device?.id === deviceId) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
        <Check className="size-4" strokeWidth={2.5} aria-hidden />
        Opgeslagen als jouw toestel
      </p>
    );
  }
  return (
    <button type="button" onClick={() => setDevice(deviceId)} className="btn btn-secondary text-sm">
      <Smartphone className="size-4" strokeWidth={1.75} aria-hidden />
      Onthoud {name} als mijn toestel
    </button>
  );
}
