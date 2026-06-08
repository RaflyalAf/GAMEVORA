import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) {
      alert(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] animate-float" />
        <div className="absolute top-1/4 right-1/4 w-[180px] h-[180px] bg-blue-600/10 blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter text-gradient uppercase">Reset Vault</h1>
          <div className="section-divider w-16 mx-auto mt-4 mb-4" />
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black">Recover your security key</p>
        </div>

        <div className="glass-card-premium p-8 md:p-10 rounded-[45px]">
          {sent ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium">Cek email kamu untuk link reset password.</p>
              <Link to="/login" className="inline-block text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-white transition underline underline-offset-4">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                  placeholder="your@email.com" required />
              </div>
              <button type="submit"
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 md:py-5 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-purple-500/5 mt-4 text-[11px] tracking-[0.2em] uppercase">
                Send Recovery Link
              </button>
            </form>
          )}

          <div className="mt-10 text-center">
            <Link to="/login" className="text-[9px] font-black text-gray-700 hover:text-gray-400 transition uppercase tracking-[0.3em]">← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
