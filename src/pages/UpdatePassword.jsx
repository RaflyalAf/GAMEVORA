import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Supabase sets the session automatically from the recovery link
      // If we redirect too fast, the user might get kicked out.
      // So we rely on the submit function to catch any errors if they aren't authenticated.
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return alert('Passwords do not match!')
    if (password.length < 6) return alert('Password too weak!')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      alert(error.message)
    } else {
      alert('Password updated!')
      navigate('/profile')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] animate-float" />
        <div className="absolute top-1/3 right-1/4 w-[180px] h-[180px] bg-blue-600/10 blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in relative">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter text-gradient uppercase">Update Key</h1>
          <div className="section-divider w-16 mx-auto mt-4 mb-4" />
          <p className="text-gray-600 text-[9px] uppercase tracking-[0.3em] font-black">Set your new security password</p>
        </div>

        <div className="glass-card-premium p-8 md:p-10 rounded-[45px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Enter new password" required />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                placeholder="Confirm password" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 md:py-5 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-purple-500/5 mt-4 text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  UPDATING
                </span>
              ) : 'Update Password'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link to="/profile" className="text-[9px] font-black text-gray-700 hover:text-gray-400 transition uppercase tracking-[0.3em]">← Back to Profile</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
