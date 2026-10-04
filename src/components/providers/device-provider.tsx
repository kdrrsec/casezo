"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";

import { getDevice } from "@/lib/catalog/devices";
import type { Device } from "@/lib/catalog/types";

/**
 * Onthoudt het gekozen toestel lokaal (localStorage) en deelt het met de
 * hele winkel. De server kent de keuze niet; URL-parameters blijven leidend
 * voor filters, zodat links deelbaar blijven.
 */
const STORAGE_KEY = "casezo:toestel";
const CHANGE_EVENT = "casezo:toestel-gewijzigd";

type DeviceContextValue = {
  device: Device | null;
  /** Toestellen waarvoor producten bestaan, in weergavevolgorde. */
  availableIds: string[];
  setDevice: (id: string) => void;
  clearDevice: () => void;
  /** Toestelkiezer (dialoog) openen of sluiten. */
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const DeviceContext = createContext<DeviceContextValue | null>(null);

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function write(id: string | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Opslag niet beschikbaar (privévenster): keuze geldt dan alleen voor deze pagina.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function DeviceProvider({ availableIds, children }: { availableIds: string[]; children: React.ReactNode }) {
  const storedId = useSyncExternalStore(subscribe, read, () => null);
  const device = storedId && availableIds.includes(storedId) ? (getDevice(storedId) ?? null) : null;

  const [pickerOpen, setPickerOpen] = useState(false);

  const setDevice = useCallback((id: string) => write(id), []);
  const clearDevice = useCallback(() => write(null), []);
  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const value = useMemo(
    () => ({ device, availableIds, setDevice, clearDevice, pickerOpen, openPicker, closePicker }),
    [device, availableIds, setDevice, clearDevice, pickerOpen, openPicker, closePicker],
  );
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice moet binnen DeviceProvider gebruikt worden.");
  return ctx;
}
