"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type InviteLinkProps = {
  value: string;
};

type CopyStatus = "idle" | "copied" | "error";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Unable to copy invitation link");
  }
}

export function InviteLink({ value }: InviteLinkProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  async function handleCopy() {
    try {
      await copyText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-white px-3 py-2 text-xs text-[#24282f]">
          {value}
        </code>
        <button
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-[#b7dfd5] bg-white px-3 text-xs font-semibold text-[#0f5f4d] transition hover:bg-[#f7fcfa]"
          onClick={handleCopy}
          type="button"
        >
          {status === "copied" ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          {status === "copied" ? "Copied" : "Copy link"}
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-[#356a61]">
        {status === "copied"
          ? "Invitation link copied to clipboard."
          : status === "error"
            ? "Copy failed. Select the link and copy it manually."
            : ""}
      </p>
    </div>
  );
}
