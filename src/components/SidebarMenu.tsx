"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dice5, Clock, Heart, Smartphone, HelpCircle } from "lucide-react";
import { getTranslations } from "@/lib/i18n";

const menuItems = [
  { key: "random" as const, icon: Dice5 },
  { key: "history" as const, icon: Clock },
  { key: "favourites" as const, icon: Heart },
  { key: "mobileapp" as const, icon: Smartphone },
  { key: "help" as const, icon: HelpCircle },
] as const;

const EASE = [0.19, 1, 0.22, 1] as const;

export function SidebarMenu() {
  const {
    isMenuOpen,
    setMenuOpen,
    activeView,
    setActiveView,
    locale,
    history,
    favourites,
  } = useStore();
  const t = getTranslations(locale);

  const counts: Record<string, number> = {
    history: history.length,
    favourites: favourites.length,
  };

  // Escape closes the panel; a drawer that only closes by click is a trap.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen, setMenuOpen]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="fixed inset-0 z-200 bg-bg/80 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("menu.title") || "Menu"}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.333, ease: EASE }}
            className="fixed inset-y-0 right-0 z-201 flex w-80 max-w-[85vw] flex-col border-l border-surface-alt bg-surface"
          >
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-surface-alt px-5">
              <span className="text-h5 font-semibold text-heading">
                {t("site.name")}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-meta transition-colors hover:text-heading"
                aria-label={t("menu.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="flex flex-col gap-0.5">
                {menuItems.map(({ key, icon: Icon }) => {
                  const isActive = activeView === key;
                  const count = counts[key];
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setActiveView(key)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-body transition-colors duration-150 ${
                          isActive
                            ? "bg-panel/40 text-heading"
                            : "text-ink hover:bg-panel/25 hover:text-heading"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-green" : "text-meta"
                          }`}
                        />
                        <span className="flex-1">{t(`menu.${key}`)}</span>
                        {count > 0 && (
                          <span
                            className="font-serif text-body-sm text-meta"
                            data-numeric
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="shrink-0 border-t border-surface-alt p-4">
              <p className="text-center text-tiny text-meta">
                {t("site.footer")}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
