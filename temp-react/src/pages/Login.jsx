import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert('Auth Failed: ' + error.message)
        setLoading(false)
      } else {
        sessionStorage.setItem('showWelcome', 'true')
        // Hold the animation for 4 seconds so the user can actually see it before navigating
        setTimeout(() => {
          navigate('/store')
        }, 4000)
      }
    } catch {
      alert('Network Error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-purple-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] animate-float" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-blue-600/10 blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <h1 className="flex items-center justify-center gap-3">
            <svg className="w-10 h-10 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            <span className="text-4xl font-black italic tracking-tighter text-gradient uppercase">GVR</span>
          </h1>
          <div className="section-divider w-16 mx-auto mt-4 mb-4" />
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black">Access Secured Vault</p>
        </div>

        <div className="glass-card-premium p-8 md:p-10 rounded-[45px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Password</label>
                <Link to="/forgot-password" className="text-[8px] font-black text-purple-400/50 hover:text-purple-400 uppercase tracking-tighter transition-colors">Forgot?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 md:py-5 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-purple-500/5 mt-2 text-[11px] tracking-[0.2em] uppercase disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  VERIFYING
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 text-center space-y-6">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              New user?
              <Link to="/register" className="text-purple-400 hover:text-white transition underline underline-offset-4 ml-2">Create Account</Link>
            </p>
            <Link to="/store" className="inline-block text-[9px] font-black text-gray-700 hover:text-gray-400 transition uppercase tracking-[0.3em]">← Back to Store</Link>
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden font-mono">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzMzMiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
          
          <div className="relative text-center w-full max-w-2xl z-10">
            <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-[#fef08a] uppercase mb-2 animate-pulse relative" 
                style={{ textShadow: '4px 4px 0px #ef4444, -4px -4px 0px #06b6d4' }}>
              <span className="absolute inset-0 animate-glitch text-[#fef08a] opacity-80" style={{ textShadow: '4px 4px 0px #ef4444' }}>BREACHING</span>
              BREACHING
            </h1>
            <h2 className="text-2xl md:text-5xl font-black italic tracking-widest text-[#06b6d4] uppercase mb-12 animate-pulse"
                style={{ textShadow: '2px 2px 0px #ef4444' }}>
              Mainframe...
            </h2>
            
            <div className="w-full bg-gray-900 h-6 border-2 border-[#fef08a] p-1 relative overflow-hidden mb-8">
              <div className="h-full bg-[#fef08a] w-[85%] animate-[pulse_0.2s_infinite]" />
              <div className="absolute top-0 bottom-0 left-0 w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] animate-shimmer" />
            </div>
            
            <div className="text-left space-y-3 text-[#06b6d4] text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-widest">
              <p>_&gt; ESTABLISHING SECURE CONNECTION [OK]</p>
              <p>_&gt; BYPASSING FIREWALL <span className="animate-pulse text-[#ef4444] ml-2">ERROR RETRYING...</span></p>
              <p>_&gt; DECRYPTING NEURAL LINK [OK]</p>
              <p className="animate-pulse text-[#fef08a]">_&gt; AUTHENTICATING USER IDENTITY...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
