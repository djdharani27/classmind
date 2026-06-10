"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [name, setName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTeacherCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    router.push(`/teacher?name=${encodeURIComponent(name)}`);
  }

  async function handleStudentJoin() {
    if (!name.trim() || !sessionCode.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", studentName: name, code: sessionCode }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      router.push(`/student?code=${data.code}&name=${encodeURIComponent(name)}`);
    } catch {
      setError("Failed to join. Check the session code.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-4 py-16">
      <header className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="text-sm font-medium text-[#818cf8] uppercase tracking-widest">
            ClassMind
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="bg-clip-text text-transparent gradient-hero animate-gradient">
            Adaptive Assessment AI
          </span>
        </h1>
        <p className="text-lg text-[#71717a] max-w-lg mx-auto">
          AI analyzes every mistake. Every weakness is backed by evidence.
          Every assessment is personalized.
        </p>
      </header>

      {!role && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl animate-slide-up">
          <button
            onClick={() => setRole("teacher")}
            className="group relative overflow-hidden rounded-2xl border border-[#2a2a3e] gradient-card p-8 text-left hover:border-[#6366f1] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-white text-2xl mb-4">
                👩‍🏫
              </div>
              <h3 className="text-xl font-semibold mb-2">I&apos;m a Teacher</h3>
              <p className="text-sm text-[#71717a]">
                Create assessments, invite students, and let AI identify their
                misconceptions with explainable evidence.
              </p>
            </div>
          </button>

          <button
            onClick={() => setRole("student")}
            className="group relative overflow-hidden rounded-2xl border border-[#2a2a3e] gradient-card p-8 text-left hover:border-[#06b6d4] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] flex items-center justify-center text-white text-2xl mb-4">
                🎓
              </div>
              <h3 className="text-xl font-semibold mb-2">I&apos;m a Student</h3>
              <p className="text-sm text-[#71717a]">
                Join a session, take the assessment, and get a personalized
                retest targeting your actual mistakes.
              </p>
            </div>
          </button>
        </div>
      )}

      {role === "teacher" && (
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Create Your Session</h2>
            <label className="block text-sm font-medium text-[#71717a] mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Professor Oak"
              className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#3f3f56] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] transition-all mb-6"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={handleTeacherCreate}
              disabled={loading || !name.trim()}
              className="w-full py-3 rounded-xl gradient-hero text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              {loading ? "Loading..." : "Create Session"}
            </button>
            <button
              onClick={() => { setRole(null); setError(""); }}
              className="w-full mt-3 py-3 rounded-xl border border-[#2a2a3e] text-[#71717a] hover:text-[#f0f0f5] hover:border-[#3f3f56] transition-all"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {role === "student" && (
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Join a Session</h2>
            <label className="block text-sm font-medium text-[#71717a] mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ash Ketchum"
              className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#3f3f56] focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all mb-4"
            />
            <label className="block text-sm font-medium text-[#71717a] mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-4 py-3 text-[#f0f0f5] placeholder-[#3f3f56] font-mono text-lg tracking-widest text-center focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all mb-6"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              onClick={handleStudentJoin}
              disabled={loading || !name.trim() || sessionCode.length < 3}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-[#0a0a10] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              {loading ? "Joining..." : "Join Session"}
            </button>
            <button
              onClick={() => { setRole(null); setError(""); }}
              className="w-full mt-3 py-3 rounded-xl border border-[#2a2a3e] text-[#71717a] hover:text-[#f0f0f5] hover:border-[#3f3f56] transition-all"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-sm text-[#3f3f56] animate-fade-in">
        <p>No accounts. No setup. Evidence-backed AI.</p>
      </footer>
    </div>
  );
}
