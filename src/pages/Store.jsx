import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'
import HeroSlider from '../components/HeroSlider'
import GameCard from '../components/GameCard'
import Pagination from '../components/Pagination'
import CartModal from '../components/CartModal'
import PaymentModal from '../components/PaymentModal'
import InboxModal from '../components/InboxModal'
import ChatWidget from '../components/ChatWidget'
import SocialFloat from '../components/SocialFloat'
import SurveyModal from '../components/SurveyModal'

const itemsPerPage = 20

export default function Store() {
  const { user } = useAuth()
  const { fetchCartCount } = useCart()
  const navigate = useNavigate()

  const [games, setGames] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' })
  const [nextGameTitle, setNextGameTitle] = useState('Syncing...')
  const [news, setNews] = useState([])
  const [featured, setFeatured] = useState([])

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  const storeRef = useRef(null)
  const featuredRef = useRef(null)

  const fetchGames = useCallback(async (keyword = '') => {
    setLoading(true)
    try {
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      let query = supabase
        .from('games')
        .select('*, reviews(rating)', { count: 'exact' })
        .order('is_trending', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter === 'trending') query = query.eq('is_trending', true)
      else if (['Online', 'Offline'].includes(filter)) query = query.eq('connectivity_type', filter)
      else if (filter !== 'all') query = query.ilike('genre', `%${filter}%`)

      if (keyword) query = query.ilike('title', `%${keyword}%`)

      const { data, count, error } = await query.range(from, to)
      if (error) throw error

      const { data: settings } = await supabase.from('settings').select('*')
      const releaseTimeStr = settings?.find(s => s.key === 'release_time')?.value
      const now = new Date()
      const target = new Date()
      if (releaseTimeStr) {
        const [h, m, s] = releaseTimeStr.split(':')
        target.setHours(h, m, s || 0)
      }

      const filteredGames = data?.filter(g => {
        if (g.release_type === 'scheduled') return now.getTime() >= target.getTime()
        return true
      }) || []

      setGames(filteredGames)
      setTotalCount(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filter])

  useEffect(() => {
    fetchGames(search)
    
    const channel = supabase.channel('store_games_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames(search)
        loadFeatured()
      })
      .subscribe()
      
    return () => supabase.removeChannel(channel)
  }, [fetchGames, search])

  useEffect(() => {
    fetchCartCount()
    initCountdown()
    fetchNews()
    loadFeatured()

    if (sessionStorage.getItem('showWelcome')) {
      setShowWelcome(true)
      sessionStorage.removeItem('showWelcome')
    }
  }, [])

  async function loadFeatured() {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('is_trending', true)
      .order('created_at', { ascending: false })
      .limit(8)
    setFeatured(data || [])
  }

  async function initCountdown() {
    const { data: settings } = await supabase.from('settings').select('*')
    const releaseTime = settings?.find(s => s.key === 'release_time')?.value
    const gameId = settings?.find(s => s.key === 'countdown_game_id')?.value
    if (!releaseTime) return

    if (gameId) {
      const { data: game } = await supabase.from('games').select('title').eq('id', gameId).single()
      if (game) setNextGameTitle(game.title)
    }

    setInterval(() => {
      const now = new Date()
      const target = new Date()
      const [h, m, s] = releaseTime.split(':')
      target.setHours(h, m, s || 0)
      let dist = target.getTime() - now.getTime()
      if (dist < 0) dist += 86400000
      setCountdown({
        hours: Math.floor((dist % 864e5) / 36e5).toString().padStart(2, '0'),
        minutes: Math.floor((dist % 36e5) / 6e4).toString().padStart(2, '0'),
        seconds: Math.floor((dist % 6e4) / 1000).toString().padStart(2, '0'),
      })
    }, 1000)
  }

  async function fetchNews() {
    const { data } = await supabase.from('vault_news').select('*').order('created_at', { ascending: false }).limit(3)
    setNews(data || [])
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    const { data: items } = await supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id)
    if (!items?.length) return alert('Cart is empty!')
    const subtotal = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0)
    const uniqueCode = Math.floor(Math.random() * 899) + 100
    const finalAmount = (Math.floor(subtotal / 1000) * 1000) + uniqueCode
    setPaymentAmount(finalAmount)
    setPaymentOpen(true)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/3 rounded-full blur-[150px]" />
      </div>

      <Navbar />
      <BottomNav />

      <SurveyModal />
      <SocialFloat />
      <ChatWidget />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-28">
        <HeroSlider games={games} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card-premium p-8 rounded-[40px] relative overflow-hidden animate-slide-up animate-border-glow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Upcoming Release</span>
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 line-clamp-1 text-gradient">{nextGameTitle}</h3>
            <div className="flex gap-4">
              {['hours', 'minutes', 'seconds'].map((unit, i) => (
                <div key={unit} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-600/5 rounded-2xl blur-sm animate-pulse" />
                      <p className="relative text-4xl md:text-5xl font-black italic tabular-nums bg-white/[0.03] px-4 py-2 rounded-2xl border border-white/[0.06] min-w-[80px]">
                        {countdown[unit]}
                      </p>
                    </div>
                    <p className="text-[7px] uppercase tracking-widest text-gray-500 mt-2 font-black">{unit}</p>
                  </div>
                  {i < 2 && (
                    <span className="text-3xl font-black text-purple-600 mb-8 animate-pulse">:</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[8px] text-gray-600 font-black uppercase tracking-widest">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              Live countdown
            </div>
          </div>

          <div className="lg:col-span-2 glass-card-premium p-8 rounded-[40px] relative overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Global News Broadcast</span>
            </div>
            <div className="space-y-4 max-h-[160px] overflow-y-auto no-scrollbar pr-2">
              {news.length === 0 ? (
                <div className="flex items-center gap-3 py-8 text-gray-600">
                  <div className="w-8 h-8 border border-white/[0.04] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">No transmissions...</span>
                </div>
              ) : (
                news.map(item => (
                  <div key={item.id} className="flex items-start justify-between border-b border-white/[0.03] pb-4 group hover:border-blue-500/20 transition-all duration-300">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[7px] font-black bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded uppercase tracking-wider">{item.category}</span>
                        <span className="text-[10px] font-bold uppercase truncate">{item.title}</span>
                      </div>
                      <p className="text-[8px] text-gray-600 truncate max-w-md leading-relaxed">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-[7px] text-gray-700 font-black uppercase whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="section-divider my-20" />
      </div>

      <main ref={storeRef} id="store" className="relative max-w-7xl mx-auto px-6 py-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div className="space-y-3">
            <span className="inline-block text-purple-400 text-[10px] font-black uppercase tracking-[0.5em] bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20">
              Inventory Browser
            </span>
            <h2 className="responsive-title font-black italic uppercase tracking-tighter leading-none">
              Vault <span className="text-gradient">Items</span>
            </h2>
          </div>
          <div className="search-bar flex p-1.5 rounded-[28px] w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search vault..."
              className="bg-transparent px-6 py-3 outline-none text-[12px] w-full md:w-72 font-bold uppercase placeholder:text-gray-600"
            />
            <button className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
              Filter
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-14 no-scrollbar overflow-x-auto pb-4">
          {[
            { key: 'all', label: 'All Items', color: 'text-white' },
            { key: 'trending', label: 'Trending', color: 'text-red-400' },
            { key: 'Online', label: 'Online', color: 'text-blue-400' },
            { key: 'Offline', label: 'Offline', color: 'text-green-400' },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setCurrentPage(1) }}
              className={`px-6 py-3.5 rounded-[20px] text-[9px] font-black uppercase active-scale transition-all duration-300 ${
                filter === cat.key
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-600/20 text-white'
                  : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
              } ${cat.color}`}
            >
              {cat.label}
            </button>
          ))}
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setCurrentPage(1) }}
            className="bg-white/[0.03] border border-white/[0.06] px-6 py-3.5 pr-10 rounded-[20px] text-[9px] font-black uppercase text-gray-400 outline-none cursor-pointer hover:bg-white/[0.06] transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1em',
            }}
          >
            <option value="all" className="bg-[#0a0a0a]">All Genres</option>
            {['Action', 'RPG', 'Horror', 'Adventure', 'Simulation'].map(g => (
              <option key={g} value={g} className="bg-[#0a0a0a]">{g}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 min-h-[400px]">
          {loading ? (
            <div className="col-span-full text-center py-20">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
                <div className="absolute inset-1 border-[3px] border-transparent border-t-purple-500 rounded-full animate-spin" />
                <div className="absolute inset-4 border-[2px] border-transparent border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <p className="mt-8 text-[10px] font-black tracking-[0.5em] uppercase text-gray-500 animate-pulse">Accessing Vault</p>
            </div>
          ) : games.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-white/[0.02] rounded-full animate-ping" />
                <div className="absolute inset-2 bg-white/[0.03] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-2">Vault Empty</p>
              <p className="text-gray-700 text-[9px] font-bold uppercase tracking-widest italic">No items match your search</p>
            </div>
          ) : (
            games.map((game, i) => (
              <div key={game.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <GameCard game={game} />
              </div>
            ))
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => {
          setCurrentPage(p)
          storeRef.current?.scrollIntoView({ behavior: 'smooth' })
        }} />
      </main>

      <CartModal onCheckout={handleCheckout} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={paymentAmount} />
      <InboxModal open={inboxOpen} onClose={() => setInboxOpen(false)} />

      {showWelcome && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative w-full max-w-sm bg-[#0a0a0f] border border-purple-500/30 rounded-3xl p-8 text-center animate-bounce-in shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full flex items-center justify-center border border-white/20 mx-auto mb-6 shadow-lg shadow-purple-500/40">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-white">Selamat Datang!</h2>
            <p className="text-[11px] text-purple-300 font-bold uppercase tracking-widest mb-4 bg-purple-500/10 inline-block px-4 py-1 rounded-full border border-purple-500/20">
              di GameVora
            </p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-8 mt-2">
              Akses ke Vault sekarang terbuka. Selamat bermain dan bereksplorasi!
            </p>
            <button onClick={() => setShowWelcome(false)}
              className="w-full py-4 bg-white/[0.05] hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
              Tutup & Mulai
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
