import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      alert(error.message)
    } else {
      setStep(2)
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery'
    })
    
    if (error) {
      alert(error.message)
    } else {
      setStep(3)
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (password.length < 6) return alert('Password minimal 6 karakter!')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      alert(error.message)
    } else {
      alert('Password berhasil diubah!')
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] animate-float" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter text-gradient uppercase">Reset Vault</h1>
          <div className="section-divider w-16 mx-auto mt-4 mb-4" />
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black">
            {step === 1 && 'Recover your security key'}
            {step === 2 && 'Enter recovery code'}
            {step === 3 && 'Set your new password'}
          </p>
        </div>

        <div className="glass-card-premium p-8 md:p-10 rounded-[45px]">
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white"
                  placeholder="your@email.com" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 disabled:opacity-50 text-[11px] tracking-[0.2em] uppercase">
                {loading ? 'SENDING...' : 'Send OTP Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Kode OTP Anda</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={8}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-center text-2xl tracking-[0.5em] font-black text-white"
                  placeholder="--------" required />
                <p className="text-[10px] text-gray-500 text-center mt-2">Cek email Anda untuk kode OTP yang dikirimkan</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-[22px] hover:opacity-80 transition-all duration-300 disabled:opacity-50 text-[11px] tracking-[0.2em] uppercase">
                {loading ? 'VERIFYING...' : 'Verify Code'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white"
                  placeholder="Enter new password" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-4 rounded-[22px] hover:opacity-80 transition-all duration-300 disabled:opacity-50 text-[11px] tracking-[0.2em] uppercase">
                {loading ? 'UPDATING...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-10 text-center">
            <Link to="/login" className="text-[9px] font-black text-gray-700 hover:text-gray-400 transition uppercase tracking-[0.3em]">← Cancel & Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
