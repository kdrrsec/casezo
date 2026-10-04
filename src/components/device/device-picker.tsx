"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useDevice } from "@/components/providers/device-provider";

import { DeviceSelector } from "./device-selector";

/** Centrale toestelkiezer als dialoog; overal te openen via useDevice().openPicker(). */
export function DevicePicker() {
  const { pickerOpen, closePicker } = useDevice();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pickerOpen && !dialog.open) dialog.showModal();
    if (!pickerOpen && dialog.open) dialog.close();
  }, [pickerOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="device-dialog-title"
      onClose={closePicker}
      onClick={(event) => {
        if (event.target === dialogRef.current) closePicker();
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-lg bg-white p-0 text-ink shadow-pop backdrop:bg-black/40 open:animate-[fade-in_150ms_ease-out]"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id="device-dialog-title" className="text-lg font-bold">
          Vind accessoires voor jouw telefoon
        </h2>
        <button
          type="button"
          onClick={closePicker}
          className="flex size-9 items-center justify-center rounded-md hover:bg-surface"
          aria-label="Sluiten"
        >
          <X className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <DeviceSelector compact onDone={closePicker} />
      </div>
    </dialog>
  );
}
