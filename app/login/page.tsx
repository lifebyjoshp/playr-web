"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("info");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessageType("error");
      setMessage(error.message);
    } else {
      setMessageType("success");
      setMessage("Login successful. Redirecting...");

      setTimeout(() => {
        router.push("/feed");
      }, 800);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0B1F5C] text-white">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-16 md:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8F200]">
              Welcome Back
            </p>
            <h1 className="mb-4 text-4xl font-extrabold md:text-5xl">
              Log into PLAYR
            </h1>
            <p className="max-w-xl text-white/75">
              Access your athlete profile, update your highlights, and continue
              building your presence.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-2xl font-bold">Login</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#081642] px-4 py-3 text-white placeholder:text-white/40 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D8F200] px-6 py-3 font-bold text-[#0B1F5C] transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>
            </form>

            {message && (
              <div
                className={`mt-4 rounded-xl p-4 text-sm font-medium ${
                  messageType === "success"
                    ? "bg-green-500/20 text-green-200"
                    : messageType === "error"
                    ? "bg-red-500/20 text-red-200"
                    : "bg-white/10 text-white"
                }`}
              >
                {message}
              </div>
            )}

            <p className="mt-6 text-sm text-white/65">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="font-semibold text-[#D8F200]">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}