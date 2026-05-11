"use client";

import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dice5, Clock, Heart } from "lucide-react";
import { getTranslations } from "@/lib/i18n";

const menuItems = [
  { key: "random" as const, icon: Dice5 },
  { key: "history" as const, icon: Clock },
  { key: "favourites" as const, icon: Heart },
] as const;

export function SidebarMenu() {
  const { isMenuOpen, setMenuOpen, activeView, setActiveView, locale, history, favourites } =
    useStore();
  const t = getTranslations(locale);

  const counts: Record<string, number> = {
    history: history.length,
    favourites: favourites.length,
  };

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={() => setMenuOpen(false)}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border z-[201] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Dice5 className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">{t("site.name")}</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
                aria-label={t("menu.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map(({ key, icon: Icon }) => {
                const isActive = activeView === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left group ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "hover:bg-muted text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/15"
                          : "bg-muted group-hover:bg-muted-foreground/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-primary" : ""} ${
                          key === "favourites" && isActive ? "fill-current" : ""
                        }`}
                      />
                    </div>
                    <span className="flex-1">{t(`menu.${key}`)}</span>
                    {counts[key] > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {counts[key]}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {t("site.footer")}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
