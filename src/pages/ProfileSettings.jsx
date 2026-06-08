import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileSettings() {
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
      }
    })
  }, [user])

  const saveProfile = async () => {
    if (!fullName.trim()) return alert('Full Name cannot be empty!')
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, username, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
    })
    if (error) {
      alert('Sync Error: ' + error.message)
    } else {
      refreshProfile()
      alert('Vault Identity Synchronized!')
    }
    setSaving(false)
  }

  const updatePassword = async () => {
    if (!newPass || newPass !== confirmPass) return alert('Passwords do not match!')
    if (newPass.length < 6) return alert('Password too weak!')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) return alert(error.message)
    alert('Security Key Updated!')
    setNewPass('')
    setConfirmPass('')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-yellow-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all active-scale">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Identity Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Avatar URL</label>
                <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 disabled:opacity-50">
                {saving ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    SYNCING
                  </span>
                ) : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <button onClick={updatePassword}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300">
                Update Password
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button onClick={signOut}
            className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-10 py-5 rounded-[30px] font-black text-[11px] uppercase tracking-widest active-scale hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </main>
    </div>
  )
}
