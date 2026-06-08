import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'

export default function Request() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gameTitle, setGameTitle] = useState('')
  const [platform, setPlatform] = useState('PC')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setLoading(true)
    const { error } = await supabase.from('game_requests').insert([{
      user_email: user.email,
      game_title: gameTitle,
      platform,
      notes,
      status: 'pending',
    }])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="max-w-3xl mx-auto pt-32 px-6 pb-32 relative">
        <div className="text-center mb-16">
          <span className="text-purple-500 text-[10px] font-black uppercase tracking-[0.5em]">Signal Relay</span>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mt-4 mb-4 text-gradient">Request</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] max-w-lg mx-auto">
            Request game atau software yang ingin kamu akses di vault.
          </p>
        </div>

        {sent ? (
          <div className="glass-card-premium p-12 rounded-[45px] text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2 text-gradient">Signal Sent!</h3>
            <p className="text-gray-400 text-sm font-medium">Request kamu telah dikirim ke admin. Tunggu update selanjutnya.</p>
          </div>
        ) : (
          <div className="glass-card-premium p-8 md:p-12 rounded-[45px] max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Game / Software Name</label>
                <input type="text" value={gameTitle} onChange={e => setGameTitle(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                  placeholder="Enter title..." required />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Platform</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 transition-all text-sm font-medium text-white cursor-pointer">
                  {['PC', 'Android', 'PlayStation', 'Xbox', 'Nintendo Switch', 'macOS', 'Linux'].map(p => (
                    <option key={p} value={p} className="bg-[#0a0a0a]">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="5"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700 resize-none"
                  placeholder="Optional..." />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-5 rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    SENDING SIGNAL
                  </span>
                ) : 'Send Signal'}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
