import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (password !== confirmPassword) throw new Error('Password dan Konfirmasi Password tidak cocok!')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, username, role: 'user' } },
      })
      if (error) throw error
      if (data.user) {
        const { error: pe } = await supabase.from('profiles').upsert({
          id: data.user.id, full_name: fullName, username, role: 'user', email,
        })
        if (pe) console.error('Profile upsert error:', pe)
      }
      alert('Registrasi Berhasil! Silakan cek email kamu untuk konfirmasi.')
      navigate('/login')
    } catch (err) {
      alert('Gagal Daftar: ' + err.message)
    } finally {
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
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black">Create your digital vault account</p>
        </div>

        <div className="glass-card-premium p-8 md:p-10 rounded-[45px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Enter your name" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Enter username" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="name@example.com" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Security Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Enter password" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Confirm password" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 md:py-5 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-purple-500/5 mt-2 text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING
                </span>
              ) : 'Register Account'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              Already have an account?
              <Link to="/login" className="text-purple-400 hover:text-white transition underline underline-offset-4 ml-1">Log In</Link>
            </p>
            <Link to="/store" className="inline-block mt-6 text-[9px] font-black text-gray-700 hover:text-gray-400 transition uppercase tracking-[0.3em]">← Back to Store</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
