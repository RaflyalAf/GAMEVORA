import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileOverview() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [libraryCount, setLibraryCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [totalSpending, setTotalSpending] = useState(0)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    init()
  }, [user])

  async function init() {
    const [approvedCountRes, approvedLib, allLibRes] = await Promise.all([
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('id, games(price, discount_price)').eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setLibraryCount(approvedCountRes.count || 0)
    setOrderCount(allLibRes.count || 0)
    setTotalSpending(
      (approvedLib.data || []).reduce((acc, curr) => acc + (Number(curr.games?.discount_price || curr.games?.price) || 0), 0)
    )
  }

  const navCards = [
    { to: '/profile/collection', label: 'My Games', count: libraryCount, bg: 'bg-purple-600/10', border: 'border-purple-500/20', groupBg: 'group-hover:bg-purple-600/20', iconColor: 'text-purple-400', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { to: '/profile/wishlist', label: 'Wishlist', count: null, bg: 'bg-pink-600/10', border: 'border-pink-500/20', groupBg: 'group-hover:bg-pink-600/20', iconColor: 'text-pink-400', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { to: '/profile/orders', label: 'Orders', count: orderCount, bg: 'bg-blue-600/10', border: 'border-blue-500/20', groupBg: 'group-hover:bg-blue-600/20', iconColor: 'text-blue-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { to: '/profile/settings', label: 'Settings', count: null, bg: 'bg-yellow-600/10', border: 'border-yellow-500/20', groupBg: 'group-hover:bg-yellow-600/20', iconColor: 'text-yellow-400', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  const stats = [
    { label: 'Orders', value: orderCount, color: 'text-purple-400' },
    { label: 'Spending', value: formatRupiah(totalSpending), color: 'text-blue-400' },
    { label: 'Collection', value: libraryCount, color: 'text-green-400' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="mb-12 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 p-1 bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=6D28D9&color=fff&size=256`}
              className="w-full h-full rounded-full object-cover border-2 border-black"
              alt="avatar"
            />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gradient">{profile?.full_name || user?.email?.split('@')[0]}</h1>
          {profile?.username && <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-1">@{profile.username}</p>}
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map(s => (
            <div key={s.label} className="glass-card-premium p-8 rounded-[35px] text-center">
              <p className={`text-3xl font-black italic ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {navCards.map(card => (
            <Link key={card.to} to={card.to}
              className="glass-card-premium p-8 rounded-[40px] flex items-center gap-6 hover:scale-[1.02] transition-all duration-300 active-scale group">
              <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center border transition-all ${card.bg} ${card.border} ${card.groupBg}`}>
                <svg className={`w-6 h-6 ${card.iconColor}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight">{card.label}</p>
                {card.count !== null && (
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{card.count} items</p>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
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
