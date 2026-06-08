import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePromptModal() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)

  const needsProfile = user && profile && (!profile.full_name || !profile.username)

  const save = async () => {
    if (!fullName.trim() || !username.trim()) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName.trim(), username: username.trim(), updated_at: new Date().toISOString(),
    })
    if (error) { alert('Gagal: ' + error.message); setSaving(false); return }
    await refreshProfile()
    setSaving(false)
  }

  if (!needsProfile) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] glass-card-premium p-8 md:p-10 rounded-[45px] animate-fade-in">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gradient text-center mb-2">Lengkapi Profil</h2>
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest text-center mb-8">Isi data diri kamu untuk melanjutkan</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
              placeholder="Enter your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
              placeholder="Enter username" />
          </div>
          <button onClick={save} disabled={saving || !fullName.trim() || !username.trim()}
            className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-4 rounded-[22px] hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50 mt-4">
            {saving ? 'MENYIMPAN...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
