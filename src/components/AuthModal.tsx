"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTranslations } from "@/lib/i18n";
import {
  supabase,
  checkUsernameAvailable,
  checkEmailAvailable,
  upsertUserProfile,
  getUserProfile,
} from "@/lib/supabaseClient";

export function AuthModal() {
  const { locale, authModalOpen, setAuthModalOpen, setUser } = useStore();
  const t = getTranslations(locale);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    resetForm();
    setAuthModalOpen(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg(
        locale === "az"
          ? "İstifadəçi adı ən azı 3 simvol olmalıdır."
          : locale === "ru"
          ? "Имя пользователя должно содержать не менее 3 символов."
          : "Username must be at least 3 characters."
      );
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(
        locale === "az"
          ? "Düzgün e-poçt ünvanı daxil edin."
          : locale === "ru"
          ? "Введите действительный адрес электронной почты."
          : "Please enter a valid email address."
      );
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(
        locale === "az"
          ? "Şifrə ən azı 6 simvol olmalıdır."
          : locale === "ru"
          ? "Пароль должен содержать не менее 6 символов."
          : "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        locale === "az"
          ? "Şifrələr uyğun gəlmir."
          : locale === "ru"
          ? "Пароли не совпадают."
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Strict Uniqueness Verification
      const isUserFree = await checkUsernameAvailable(cleanUser);
      const isEmailFree = await checkEmailAvailable(cleanEmail);

      if (!isUserFree || !isEmailFree) {
        setErrorMsg(
          locale === "az"
            ? "Bu e-poçt və ya istifadəçi adı artıq qeydiyyatdan keçib."
            : locale === "ru"
            ? "Этот адрес электронной почты или имя пользователя уже зарегистрированы."
            : "This email or username is already registered."
        );
        setLoading(false);
        return;
      }

      // 2. Perform Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUser,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("unique")
        ) {
          setErrorMsg(
            locale === "az"
              ? "Bu e-poçt və ya istifadəçi adı artıq qeydiyyatdan keçib."
              : locale === "ru"
              ? "Этот адрес электронной почты или имя пользователя уже зарегистрированы."
              : "This email or username is already registered."
          );
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const profileObj = {
          id: data.user.id,
          username: cleanUser,
          email: cleanEmail,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
        };
        await upsertUserProfile(profileObj);
        setUser({ id: data.user.id, email: cleanEmail }, profileObj);
        setSuccessMsg(
          locale === "az"
            ? "Qeydiyyat uğurla tamamlandı!"
            : locale === "ru"
            ? "Регистрация успешно завершена!"
            : "Registration successful!"
        );
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg(
        locale === "az"
          ? "Bütün xanaları doldurun."
          : locale === "ru"
          ? "Пожалуйста, заполните все поля."
          : "Please fill in all fields."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMsg(
          locale === "az"
            ? "E-poçt və ya şifrə yanlışdır."
            : locale === "ru"
            ? "Неверный адрес электронной почты или пароль."
            : "Invalid email or password."
        );
        setLoading(false);
        return;
      }

      if (data.user) {
        let profile = await getUserProfile(data.user.id);
        if (!profile) {
          profile = {
            id: data.user.id,
            username: data.user.user_metadata?.username || cleanEmail.split("@")[0],
            email: cleanEmail,
            avatar_url:
              data.user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
          };
        }
        setUser({ id: data.user.id, email: cleanEmail }, profile);
        setSuccessMsg(
          locale === "az"
            ? "Uğurla daxil oldunuz!"
            : locale === "ru"
            ? "Вы успешно вошли!"
            : "Successfully logged in!"
        );
        setTimeout(() => {
          handleClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Giriş zamanı xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-ink-2 border border-ink-4 shadow-lifted rounded-xs p-6 space-y-5 text-ink-9"
          id="auth-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-4 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-live" />
              <h3 className="text-body-lg font-semibold">
                {mode === "login"
                  ? locale === "az"
                    ? "Hesaba Daxil Ol"
                    : locale === "ru"
                    ? "Вход в Аккаунт"
                    : "Log In"
                  : locale === "az"
                  ? "Yeni Hesab Yarat"
                  : locale === "ru"
                  ? "Создать Аккаунт"
                  : "Create Account"}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="ctl ctl-ghost h-8 w-8 px-0 text-ink-6 hover:text-ink-9"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-ink-1 border border-ink-4 rounded-xs text-xs font-medium">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xs transition-colors ${
                mode === "login"
                  ? "bg-ink-3 text-ink-9 font-semibold shadow-xs"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              {locale === "az" ? "Daxil Ol" : locale === "ru" ? "Вход" : "Log In"}
            </button>
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-xs transition-colors ${
                mode === "register"
                  ? "bg-ink-3 text-ink-9 font-semibold shadow-xs"
                  : "text-ink-6 hover:text-ink-8"
              }`}
            >
              {locale === "az" ? "Qeydiyyat" : locale === "ru" ? "Регистрация" : "Register"}
            </button>
          </div>

          {/* Error / Success Notifications */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              id="auth-error-msg"
              className="flex items-start gap-2.5 rounded-xs border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              id="auth-success-msg"
              className="flex items-start gap-2.5 rounded-xs border border-live-border/40 bg-live/10 p-3 text-xs text-live"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-live" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="space-y-3.5"
            id="auth-form"
          >
            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-label text-ink-7" htmlFor="auth-username">
                  {locale === "az"
                    ? "İstifadəçi Adı (Username)"
                    : locale === "ru"
                    ? "Имя пользователя"
                    : "Username"}
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="novruz29"
                    className="inp w-full pl-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-label text-ink-7" htmlFor="auth-email">
                {locale === "az"
                  ? "E-poçt Ünvanı"
                  : locale === "ru"
                  ? "Электронная почта"
                  : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="inp w-full pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-label text-ink-7" htmlFor="auth-password">
                {locale === "az" ? "Şifrə" : locale === "ru" ? "Пароль" : "Password"}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="inp w-full pl-9 text-xs"
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-label text-ink-7" htmlFor="auth-confirm-password">
                  {locale === "az"
                    ? "Şifrəni Təkrar Edin"
                    : locale === "ru"
                    ? "Повторите пароль"
                    : "Confirm Password"}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-6" />
                  <input
                    id="auth-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="inp w-full pl-9 text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              id="auth-submit-btn"
              className="ctl ctl-primary w-full h-9 text-xs font-semibold mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{locale === "az" ? "Gözləyin..." : "Processing..."}</span>
                </>
              ) : (
                <span>
                  {mode === "login"
                    ? locale === "az"
                      ? "Daxil Ol"
                      : locale === "ru"
                      ? "Войти"
                      : "Log In"
                    : locale === "az"
                    ? "Hesabı Qeydiyyatdan Keçir"
                    : locale === "ru"
                    ? "Зарегистрироваться"
                    : "Create Account"}
                </span>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
