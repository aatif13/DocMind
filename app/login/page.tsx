"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPw, setShowLoginPw] = useState(false)

  // Register form state
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [showRegPw, setShowRegPw] = useState(false)

  async function handleLogin() {
    setLoading(true); setError("")
    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) setError("Invalid email or password")
    else router.push("/dashboard")
  }

  async function handleRegister() {
    setLoading(true); setError(""); setSuccess("")
    if (regPassword !== regConfirm) {
      setError("Passwords do not match"); setLoading(false); return
    }
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess("Account created! Sign in to continue.")
    setTab("login")
    setLoginEmail(regEmail)
  }

  const inputClass = `
    w-full px-4 py-3 rounded-xl text-sm
    bg-[rgba(6,12,28,0.6)]
    border border-[rgba(100,130,255,0.20)]
    focus:border-[rgba(79,127,255,0.60)] focus:outline-none
    text-[rgba(220,230,255,0.90)]
    placeholder:text-[rgba(100,120,180,0.40)]
    transition-colors duration-200
  `

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md rounded-2xl bg-[rgba(6,12,28,0.55)] border border-[rgba(100,130,255,0.18)] backdrop-blur-xl p-8 flex flex-col gap-6">

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-xl font-light tracking-[0.4em] uppercase text-[rgba(220,230,255,0.95)]">
            DocMind
          </h1>
          <p className="text-xs text-[rgba(100,120,180,0.60)] mt-1 tracking-wider">
            Understand any document instantly
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[rgba(6,12,28,0.60)] border border-[rgba(100,130,255,0.15)] p-1">
          {(["login", "register"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setSuccess("") }}
              className={`flex-1 py-2 text-sm rounded-lg transition-all duration-200 capitalize tracking-wide
                ${tab === t
                  ? "bg-[rgba(79,127,255,0.18)] border border-[rgba(79,127,255,0.35)] text-[rgba(140,180,255,0.95)]"
                  : "text-[rgba(100,120,180,0.55)] hover:text-[rgba(140,160,210,0.80)]"
                }`}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Error / Success */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[rgba(255,60,60,0.08)] border border-[rgba(255,60,60,0.20)] text-[rgba(255,120,120,0.90)] text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-xl bg-[rgba(60,200,120,0.08)] border border-[rgba(60,200,120,0.20)] text-[rgba(100,220,150,0.90)] text-sm">
            {success}
          </div>
        )}

        {/* Login form */}
        {tab === "login" && (
          <div className="flex flex-col gap-3">
            <input className={inputClass} type="email" placeholder="Email address"
              value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <div className="relative">
              <input className={inputClass} type={showLoginPw ? "text" : "password"}
                placeholder="Password" value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button type="button" onClick={() => setShowLoginPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(100,120,180,0.50)] hover:text-[rgba(140,160,210,0.80)] text-xs">
                {showLoginPw ? "Hide" : "Show"}
              </button>
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="mt-2 w-full py-3 rounded-xl text-sm font-medium tracking-wide
                bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.35)]
                text-[rgba(140,180,255,0.90)]
                hover:bg-[rgba(79,127,255,0.25)] hover:border-[rgba(79,127,255,0.60)]
                disabled:opacity-40 transition-all duration-200">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}

        {/* Register form */}
        {tab === "register" && (
          <div className="flex flex-col gap-3">
            <input className={inputClass} type="text" placeholder="Full name"
              value={regName} onChange={e => setRegName(e.target.value)} />
            <input className={inputClass} type="email" placeholder="Email address"
              value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            <div className="relative">
              <input className={inputClass} type={showRegPw ? "text" : "password"}
                placeholder="Password (min 8 chars)" value={regPassword}
                onChange={e => setRegPassword(e.target.value)} />
              <button type="button" onClick={() => setShowRegPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(100,120,180,0.50)] hover:text-[rgba(140,160,210,0.80)] text-xs">
                {showRegPw ? "Hide" : "Show"}
              </button>
            </div>
            <input className={inputClass} type="password" placeholder="Confirm password"
              value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()} />
            <button onClick={handleRegister} disabled={loading}
              className="mt-2 w-full py-3 rounded-xl text-sm font-medium tracking-wide
                bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.35)]
                text-[rgba(140,180,255,0.90)]
                hover:bg-[rgba(79,127,255,0.25)] hover:border-[rgba(79,127,255,0.60)]
                disabled:opacity-40 transition-all duration-200">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
