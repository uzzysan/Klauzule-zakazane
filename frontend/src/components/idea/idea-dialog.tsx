"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";

const IDEA_MIN = 20;
const IDEA_MAX = 5000;
const CONTACT_MAX = 200;

type SubmitState =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "success"; issueNumber: number }
  | { phase: "error"; message: string };

/** Formularz „Zgłoś pomysł" — zgłoszenie trafia na ten sam origin
 *  (POST /api/idea, idea-gateway) i ląduje jako issue z etykietą idea.
 *  Frontend nie zna sekretów i nie wybiera repozytorium. */
export function IdeaDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [contact, setContact] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ phase: "idle" });
  const [fieldError, setFieldError] = useState<string | null>(null);

  const sending = submit.phase === "sending";
  const success = submit.phase === "success" ? submit.issueNumber : null;
  const error = submit.phase === "error" ? submit.message : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const text = idea.trim();
    if (text.length < IDEA_MIN) {
      setFieldError("Opis pomysłu musi mieć co najmniej 20 znaków.");
      return;
    }
    if (idea.length > IDEA_MAX) {
      setFieldError("Opis pomysłu może mieć co najwyżej 5000 znaków.");
      return;
    }
    if (contact.length > CONTACT_MAX) {
      setFieldError("Kontakt może mieć co najwyżej 200 znaków.");
      return;
    }
    setFieldError(null);
    setSubmit({ phase: "sending" });
    try {
      const response = await fetch("/api/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: text,
          contact,
          request_id: crypto.randomUUID(),
          website: "",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.ok === true && Number.isInteger(payload.issue_number)) {
        setSubmit({ phase: "success", issueNumber: payload.issue_number });
        setIdea("");
        setContact("");
        return;
      }
      if (response.status === 409) {
        setSubmit({ phase: "error", message: "Takie zgłoszenie zostało już wysłane." });
        return;
      }
      if (response.status === 429) {
        const minutes = Math.max(1, Math.ceil((payload?.retry_after_seconds ?? 60) / 60));
        setSubmit({ phase: "error", message: `Limit zgłoszeń osiągnięty — spróbuj ponownie za ok. ${minutes} min.` });
        return;
      }
      setSubmit({ phase: "error", message: "Nie udało się wysłać zgłoszenia. Treść została zachowana — spróbuj ponownie za chwilę." });
    } catch {
      setSubmit({ phase: "error", message: "Nie udało się wysłać zgłoszenia. Treść została zachowana — spróbuj ponownie za chwilę." });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSubmit({ phase: "idle" });
          setFieldError(null);
          setOpen(true);
        }}
        className={linkLike}
      >
        <Lightbulb className="h-4 w-4" aria-hidden />
        Zgłoś pomysł
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label="Zgłoś pomysł"
        className="backdrop:bg-black/60 open:flex open:justify-center open:items-start open:pt-[10vh] m-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg w-[min(520px,calc(100vw-2rem))]"
      >
        <div className="w-full">
          <h2 className="text-lg font-semibold">Zgłoś pomysł</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Zauważyłeś coś, co można zrobić lepiej? Napisz — trafi to do listy pomysłów przy projekcie.
          </p>
          {success !== null ? (
            <p className="mt-4 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm" aria-live="polite">
              Dziękujemy! Pomysł zapisano jako zgłoszenie #{success}.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <input
                type="text"
                name="website"
                value=""
                readOnly
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <label htmlFor="idea-idea" className="mt-4 mb-1.5 block text-sm text-muted-foreground">
                Pomysł
              </label>
              <textarea
                id="idea-idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                minLength={IDEA_MIN}
                maxLength={IDEA_MAX}
                disabled={sending}
                placeholder="Co chcesz udoskonalić i dlaczego?"
                className="min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-destructive" aria-live="polite">
                  {fieldError ?? ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {idea.length}/{IDEA_MAX}
                </span>
              </div>
              <label htmlFor="idea-contact" className="mt-3 mb-1.5 block text-sm text-muted-foreground">
                Kontakt (opcjonalnie)
              </label>
              <input
                id="idea-contact"
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                maxLength={CONTACT_MAX}
                disabled={sending}
                placeholder="e-mail lub inny kontakt — opcjonalnie"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Zgłoszenie trafia do repozytorium projektu. Nie dołączamy automatycznie żadnych danych — nie wpisuj
                informacji poufnych.
              </p>
              <p className="mt-2 min-h-[1em] text-sm text-destructive" aria-live="polite">
                {error ?? ""}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="rounded-md border border-input bg-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                  Zamknij
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? "Wysyłanie…" : "Wyślij"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

const linkLike =
  "inline-flex items-center gap-2 rounded-sm text-muted-foreground transition-colors duration-base hover:text-foreground";
