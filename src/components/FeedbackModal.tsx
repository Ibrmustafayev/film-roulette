"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";

const EASE = [0.2, 0.8, 0.2, 1] as const;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  prefillMedia?: { title: string; id: number } | null;
}

export function FeedbackModal({ open, onClose, prefillMedia }: FeedbackModalProps) {
  const { locale } = useStore();
  const t = getTranslations(locale);

  const [name, setName] = useState("");
  const [issueType, setIssueType] = useState("broken");
  const [mediaTitle, setMediaTitle] = useState(prefillMedia ? `${prefillMedia.title} (ID: ${prefillMedia.id})` : "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const issueTypes = [
    { value: "broken", label: t("feedback.issueBroken") },
    { value: "missing", label: t("feedback.issueMissing") },
    { value: "audio", label: t("feedback.issueAudio") },
    { value: "other", label: t("feedback.issueOther") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");

    try {
      const selectedType = issueTypes.find((i) => i.value === issueType);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          issueType: selectedType?.label || issueType,
          mediaTitle: mediaTitle.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          onClose();
          setStatus("idle");
          setName("");
          setIssueType("broken");
          setMediaTitle("");
          setMessage("");
        }, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="relative w-full max-w-lg bg-ink-2 border border-ink-4 shadow-lifted overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-4 px-6 py-4">
              <h2 className="text-h4 font-semibold text-ink-9">{t("feedback.title")}</h2>
              <button
                type="button"
                onClick={onClose}
                className="ctl ctl-ghost h-7 w-7 px-0"
                aria-label={t("feedback.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success State */}
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="h-12 w-12 text-live" />
                </motion.div>
                <p className="text-body text-ink-8 text-center font-medium">
                  {t("feedback.success")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <p className="text-small text-ink-6">{t("feedback.subtitle")}</p>

                {/* Name / Email */}
                <div>
                  <label className="text-label text-ink-7 uppercase tracking-[0.1em] mb-1.5 block">
                    {t("feedback.name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("feedback.namePlaceholder")}
                    className="inp w-full"
                  />
                </div>

                {/* Issue Type */}
                <div>
                  <label className="text-label text-ink-7 uppercase tracking-[0.1em] mb-1.5 block">
                    {t("feedback.issueType")}
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="inp w-full cursor-pointer"
                  >
                    {issueTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Media Title */}
                <div>
                  <label className="text-label text-ink-7 uppercase tracking-[0.1em] mb-1.5 block">
                    {t("feedback.mediaTitle")}
                  </label>
                  <input
                    type="text"
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    placeholder={t("feedback.mediaTitlePlaceholder")}
                    className="inp w-full"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-label text-ink-7 uppercase tracking-[0.1em] mb-1.5 block">
                    {t("feedback.message")} *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("feedback.messagePlaceholder")}
                    required
                    rows={4}
                    className="inp w-full resize-none"
                  />
                </div>

                {/* Error */}
                {status === "error" && (
                  <div className="flex items-center gap-2 text-small text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{t("feedback.error")}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "sending" || !message.trim()}
                  className="ctl ctl-primary w-full h-10 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("feedback.sending")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{t("feedback.submit")}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
