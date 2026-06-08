import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileCollection() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [library, setLibrary] = useState([])
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialTitle, setTutorialTitle] = useState('')
  const [tutorialContent, setTutorialContent] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    
    const fetchLibrary = () => {
      supabase.from('library').select('*, games(*)').eq('user_id', user.id).eq('status', 'approved').then(({ data }) => {
        setLibrary(data || [])
      })
    }
    fetchLibrary()
    
    const channel = supabase.channel('profile_collection_page_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: 'user_id=eq.' + user.id }, fetchLibrary)
      .subscribe()
      
    return () => supabase.removeChannel(channel)
  }, [user])

  const showTutorial = async (gameId) => {
    const { data: game } = await supabase.from('games').select('title, manual_guide').eq('id', gameId).single()
    if (!game) return alert('Failed to load guide.')
    setTutorialTitle(`MANUAL: ${game.title}`)
    setTutorialContent(game.manual_guide || 'Belum ada panduan untuk arsip ini.')
    setTutorialOpen(true)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
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
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">My Games</h1>
        </div>

        <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
          {library.length === 0 ? (
            <p className="opacity-30 text-center py-10 text-[10px] font-black uppercase italic">No collection found</p>
          ) : (
            library.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <img src={item.games?.thumbnail} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" alt={item.games?.title} />
                  <div>
                    <h5 className="text-[11px] font-black uppercase leading-tight">{item.games?.title || 'Unknown'}</h5>
                    <p className="text-[8px] text-purple-400 font-bold uppercase mt-1 tracking-widest">Vault Granted</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showTutorial(item.games?.id)} className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-full font-black text-[8px] uppercase border border-yellow-500/20 active-scale hover:bg-yellow-500/20 transition-all">Tutorial</button>
                  <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white text-black rounded-full font-black text-[8px] uppercase active-scale hover:bg-purple-600 hover:text-white transition-all">Access</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {tutorialOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setTutorialOpen(false)} />
          <div className="relative glass-card-premium p-8 rounded-[45px] max-w-lg w-full max-h-[75vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-gradient">{tutorialTitle}</h2>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line font-medium">{tutorialContent}</p>
            <button onClick={() => setTutorialOpen(false)}
              className="w-full mt-8 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase active-scale border border-white/10 hover:bg-white/10 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
