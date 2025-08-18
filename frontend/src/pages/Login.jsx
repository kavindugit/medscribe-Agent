// Save as src/pages/LoginPage.jsx (Tailwind CSS)
// Wires the form to http://localhost:4000/api/auth/login with credentials

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Simple client validation
    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include", // allow backend to set httpOnly cookie
        body: JSON.stringify({ email, password, remember }),
      });

      // Try to parse JSON (even on non-2xx)
      let data = null;
      try { data = await res.json(); } catch { /* ignore parse errors */ }

      if (!res.ok || !data?.success) {
        const msg = data?.message || `Login failed (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      // Success → go to /home
      navigate("/home");
    } catch (err) {
      // Make CORS/network errors human-friendly
      const msg = (err?.message === "Failed to fetch")
        ? "Can't reach the server. Check that the backend is running on http://localhost:4000 and CORS allows http://localhost:5173."
        : (err?.message || "Something went wrong. Try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white">
      {/* Background visuals */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-40" style={{
          background: "radial-gradient(closest-side, #22d3ee, transparent)"
        }} />
        <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40" style={{
          background: "radial-gradient(closest-side, #a78bfa, transparent)"
        }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')] opacity-10" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/40 via-white/40 to-fuchsia-300/40" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col lg:grid lg:grid-cols-2">
        {/* Left: Brand + value prop */}
        <section className="hidden lg:flex flex-col justify-between p-10">
          <header className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-black">
              MR
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">MedReport Assist</h1>
              <p className="text-sm text-neutral-300">Private • Safe • Cited</p>
            </div>
          </header>

          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              Your medical reports,<br /> translated into clarity.
            </h2>
            <ul className="space-y-3 text-neutral-300">
              <li className="flex items-start gap-3"><span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-400"></span> Plain‑language explanations of medical terms.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-400"></span> Accurate, cited summaries for clinicians & patients.</li>
              <li className="flex items-start gap-3"><span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400"></span> Private by design — you control your data.</li>
            </ul>
          </div>

          <footer className="text-xs text-neutral-400">
            © {new Date().getFullYear()} MedReport Assist • Educational support — not a medical diagnosis.
          </footer>
        </section>

        {/* Right: Login card */}
        <main className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-black font-black">MR</div>
              <h2 className="text-2xl font-bold">Welcome back</h2>
              <p className="mt-1 text-sm text-neutral-300">Sign in to access your reports</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_-15px_rgba(168,85,247,0.6)] backdrop-blur">
              <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm text-neutral-300">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-neutral-900/60 px-4 py-3 text-sm outline-none ring-0 placeholder:text-neutral-500 focus:border-cyan-400"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm text-neutral-300">Password</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900/60 px-3 focus-within:border-cyan-400">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-neutral-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="rounded-lg px-2 py-1 text-xs text-neutral-300 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-neutral-900 text-cyan-400 focus:ring-0"
                    />
                    Remember me
                  </label>
                  <a href="#" className="text-sm text-cyan-300 hover:text-cyan-200">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-black font-semibold transition focus:outline-none disabled:opacity-70"
                >
                  <span className="absolute inset-0 -z-10 bg-white/20 opacity-0 blur transition group-hover:opacity-100" />
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <div className="pt-2 text-center text-xs text-neutral-400">
                  By signing in, you agree to our Terms & Privacy Policy.
                </div>
              </form>

              <div className="mt-6">
                <div className="relative my-3 text-center text-xs text-neutral-400">
                  <span className="relative z-10 bg-neutral-950 px-2">or</span>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="rounded-xl border border-white/10 bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-200 hover:border-cyan-400">Continue with Google</button>
                  <button className="rounded-xl border border-white/10 bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-200 hover:border-cyan-400">Continue with Microsoft</button>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-neutral-300">
              New to MedReport Assist? <a href="/signup" className="text-cyan-300 hover:text-cyan-200">Create an account</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
