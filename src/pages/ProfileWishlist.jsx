import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileWishlist() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    supabase.from('cart').select('*, games(*)').eq('user_id', user.id).then(({ data }) => {
      setWishlist(data || [])
    })
  }, [user])

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
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all active-scale">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">Wishlist</h1>
        </div>

        <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
          {wishlist.length === 0 ? (
            <p className="opacity-30 text-center py-10 text-[10px] font-black uppercase italic">Wishlist is empty</p>
          ) : (
            wishlist.map(item => (
              <div key={item.id} className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-3xl flex items-center justify-between hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <img src={item.games?.thumbnail} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt={item.games?.title} />
                  <div>
                    <h4 className="text-[10px] font-black uppercase leading-tight">{item.games?.title || 'Unknown'}</h4>
                    <p className="text-[8px] text-pink-500 font-bold uppercase mt-0.5">Stored in Cart</p>
                  </div>
                </div>
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase active-scale shadow-lg hover:bg-purple-600 hover:text-white transition-all">VIEW</button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
