// Save as src/pages/SignupPage.jsx
// Tailwind CSS required
// Wires to backend: http://localhost:4000/api/auth/register

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    nic: "",
    email: "",
    phoneNo: "",
    address: "",
    gender: "",
    dob: "",
    password: "",
    confirmPassword: "",
    remember: false,
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/\S+@\S+\.\S+/.test(form.email))
      return setError("Please enter a valid email address.");
    if (!form.fullName || !form.nic || !form.phoneNo || !form.address || !form.gender || !form.dob)
      return setError("Please complete all required fields.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (!form.agree)
      return setError("You must agree to the Terms and Privacy Policy.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName,
          nic: form.nic,
          email: form.email,
          phoneNo: form.phoneNo,
          address: form.address,
          gender: form.gender,
          dob: form.dob,
          password: form.password,
          role: "patient",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Registration failed (HTTP ${res.status}).`);
      }

      setSuccess("✅ Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden">
      {/* 🔥 Animated backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[38rem] w-[38rem] rounded-full blur-3xl bg-cyan-500/20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-[38rem] w-[38rem] rounded-full blur-3xl bg-emerald-500/20 animate-pulse" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300/40 via-white/30 to-emerald-300/40" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col lg:grid lg:grid-cols-2">
        {/* Left branding */}
        <section className="hidden lg:flex flex-col justify-between p-10">
          <header className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-black font-black">
              MR
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                MedReport Assist
              </h1>
              <p className="text-sm text-neutral-300">Create your account</p>
            </div>
          </header>

          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              Join MedReport Assist <br /> for clarity & privacy
            </h2>
            <ul className="space-y-3 text-neutral-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Upload reports securely with encrypted storage.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Term translations & summaries with citations.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                You control access and retention policies.
              </li>
            </ul>
          </div>

          <footer className="text-xs text-neutral-500">
            © {new Date().getFullYear()} MedReport Assist • Support tool — not a diagnosis.
          </footer>
        </section>

        {/* Right signup card */}
        <main className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Mobile header */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-black font-black">
                MR
              </div>
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Sign up to start managing reports
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_0_40px_-15px_rgba(34,211,238,0.6)] backdrop-blur">
              <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {error && (
                  <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="md:col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                    {success}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-sm text-neutral-300">Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    placeholder="Dr. Jane Doe"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* NIC */}
                <div>
                  <label className="block text-sm text-neutral-300">NIC</label>
                  <input
                    name="nic"
                    value={form.nic}
                    onChange={onChange}
                    placeholder="200011100123"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-neutral-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-neutral-300">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNo"
                    value={form.phoneNo}
                    onChange={onChange}
                    placeholder="+94 71 234 5678"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-neutral-300">Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    placeholder="12, Main Street, Colombo"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm text-neutral-300">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={onChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  >
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm text-neutral-300">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={onChange}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm text-neutral-300">Password</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 focus-within:border-cyan-400">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="rounded-lg px-2 py-1 text-xs text-neutral-300 hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-neutral-300">Confirm Password</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-3 focus-within:border-cyan-400">
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={onChange}
                      placeholder="••••••••"
                      className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="rounded-lg px-2 py-1 text-xs text-neutral-300 hover:text-white"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Agreements */}
                <div className="md:col-span-2 flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={onChange}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-0"
                    />
                    Remember me on this device
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="checkbox"
                      name="agree"
                      checked={form.agree}
                      onChange={onChange}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400 focus:ring-0"
                    />
                    I agree to the{" "}
                    <a href="#" className="text-cyan-300 hover:text-emerald-300">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-cyan-300 hover:text-emerald-300">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-500 px-4 py-3 text-black font-semibold transition hover:scale-105 focus:outline-none disabled:opacity-70"
                  >
                    <span className="absolute inset-0 -z-10 bg-white/20 opacity-0 blur transition group-hover:opacity-100" />
                    {loading ? "Creating account…" : "Create account"}
                  </button>
                </div>

                <p className="md:col-span-2 text-center text-sm text-neutral-300">
                  Already have an account?{" "}
                  <a href="/login" className="text-cyan-300 hover:text-emerald-300">
                    Sign in
                  </a>
                </p>

                <p className="md:col-span-2 pt-2 text-center text-xs text-neutral-500">
                  We never share your data. Educational support — not a medical diagnosis.
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
