import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function Giveaways() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [giveaways, setGiveaways] = useState([])
  const [joined, setJoined] = useState(new Set())
  const [joining, setJoining] = useState(null)

  useEffect(() => {
    fetchGiveaways()
  }, [])

  const fetchGiveaways = async () => {
    const { data } = await supabase
      .from('giveaways')
      .select('*, games(title, thumbnail)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setGiveaways(data || [])

    if (user) {
      const { data: entries } = await supabase
        .from('giveaway_entries')
        .select('giveaway_id')
        .eq('user_id', user.id)
      setJoined(new Set((entries || []).map(e => e.giveaway_id)))
    }
  }

  const joinGiveaway = async (giveawayId) => {
    if (!user) { navigate('/login'); return }
    setJoining(giveawayId)
    const { error } = await supabase.from('giveaway_entries').insert([{
      giveaway_id: giveawayId,
      user_id: user.id,
    }])
    if (error) {
      alert(error.message)
    } else {
      setJoined(prev => new Set(prev).add(giveawayId))
    }
    setJoining(null)
  }

  const getTimeLeft = (endsAt) => {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return 'Berakhir'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}j ${m}m`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-pink-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/store')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all active-scale">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">🎉 Giveaway</h1>
        </div>

        {giveaways.length === 0 ? (
          <div className="glass-card-premium p-16 rounded-[40px] text-center">
            <p className="text-6xl mb-6">🎁</p>
            <p className="text-lg font-black uppercase tracking-widest text-gray-400">Belum ada giveaway aktif</p>
            <p className="text-[10px] text-gray-600 mt-2 font-medium">Nantikan giveaway berikutnya!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map(g => (
              <div key={g.id} className="glass-card-premium rounded-[30px] overflow-hidden group hover:border-purple-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-purple-600/10">
                <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <span className="text-6xl relative z-20">🎁</span>
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                      {getTimeLeft(g.ends_at)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[7px] font-black bg-purple-500/15 text-purple-400 px-2.5 py-1 rounded uppercase tracking-wider">Giveaway</span>
                    <span className="text-[7px] font-black bg-green-500/15 text-green-400 px-2.5 py-1 rounded uppercase tracking-wider">{g.winner_count} Winner{g.winner_count > 1 ? 's' : ''}</span>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight leading-tight mb-2">{g.title}</h3>
                  {g.description && <p className="text-[9px] text-gray-500 leading-relaxed mb-4">{g.description}</p>}
                  <div className="flex items-center gap-3 py-3 border-t border-white/[0.06] mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs font-black">{g.games?.title?.charAt(0) || '?'}</div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Hadiah</p>
                      <p className="text-xs font-bold">{g.games?.title || 'Unknown'}</p>
                    </div>
                  </div>
                  <button onClick={() => joinGiveaway(g.id)} disabled={joined.has(g.id) || joining === g.id}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black py-4 rounded-[20px] text-[10px] tracking-[0.2em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active-scale hover:shadow-xl hover:shadow-purple-600/20">
                    {joining === g.id ? 'Joining...' : joined.has(g.id) ? '✓ Joined' : 'Join Giveaway'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
