"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type DialogState =
  | { kind: "confirm"; message: string; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "alert"; message: string; title?: string; resolve: () => void }
  | null;

type DialogContextValue = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, title?: string) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * Site-styled replacement for window.confirm/alert — those render as a
 * bare browser/Chrome dialog with the deployment URL in the title, which
 * looks broken next to the rest of the UI. Anything needing a confirm or
 * a heads-up should go through useDialog() instead.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ kind: "confirm", message, options: options ?? {}, resolve });
    });
  }, []);

  const notify = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setState({ kind: "alert", message, title, resolve });
    });
  }, []);

  function close(result?: boolean) {
    setState((current) => {
      if (!current) return null;
      if (current.kind === "confirm") current.resolve(!!result);
      else current.resolve();
      return null;
    });
  }

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}
      {state && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
          style={{ zIndex: 2147483647 }}
          onClick={() => close(false)}
        >
          <div
            className="card-shadow reveal relative w-full max-w-sm rounded-3xl bg-white p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {state.kind === "confirm" ? (
              <>
                {state.options.title && (
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                    {state.options.title}
                  </h2>
                )}
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                  {state.message}
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={() => close(true)}
                    className={`rounded-full px-5 py-3 text-[14px] font-medium text-white transition-colors ${
                      state.options.danger
                        ? "bg-[var(--red)] hover:bg-red-700"
                        : "pill-black"
                    }`}
                  >
                    {state.options.confirmLabel ?? "Onayla"}
                  </button>
                  <button
                    onClick={() => close(false)}
                    className="rounded-full px-5 py-3 text-[14px] font-medium text-[var(--ink-secondary)] transition-colors hover:text-[var(--ink)]"
                  >
                    {state.options.cancelLabel ?? "Vazgeç"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {state.title && (
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                    {state.title}
                  </h2>
                )}
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                  {state.message}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => close()}
                    className="pill-black rounded-full px-5 py-3 text-[14px] font-medium"
                  >
                    Tamam
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}
