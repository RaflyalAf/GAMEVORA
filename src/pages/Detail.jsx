import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import CartModal from '../components/CartModal'
import PaymentModal from '../components/PaymentModal'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, fetchCartCount } = useCart()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState('0.0')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStep, setInstallStep] = useState(0)
  const [showEngineWarning, setShowEngineWarning] = useState(false)

  useEffect(() => {
    if (!id) { navigate('/'); return }
    loadGame()
  }, [id])

  async function loadGame() {
    try {
      const [gameRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', id).single(),
      ])
      if (gameRes.error) throw new Error('Game not found')
      setGame(gameRes.data)

      if (user) {
        const { data: entry } = await supabase.from('library').select('status').eq('user_id', user.id).eq('game_id', id).maybeSingle()
        if (entry) setStatus(entry.status)
      }

      loadReviews()
      fetchCartCount()
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profiles:user_id(full_name, avatar_url)')
      .eq('game_id', id)
      .order('created_at', { ascending: false })
    if (data) {
      setReviews(data)
      if (data.length > 0) {
        setAvgRating((data.reduce((acc, r) => acc + r.rating, 0) / data.length).toFixed(1))
      }
    }
  }

  const submitReview = async () => {
    if (selectedRating === 0) return alert('Pilih bintang terlebih dahulu!')
    if (!user) return alert('Silakan login untuk mengirim ulasan.')
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert([{
      game_id: id, user_id: user.id, rating: selectedRating, comment,
    }])
    if (error) {
      if (error.code === '23505') alert('Anda sudah mereview game ini.')
      else alert(error.message)
    } else {
      setComment('')
      setSelectedRating(0)
      loadReviews()
    }
    setSubmittingReview(false)
  }



  const handleBuy = async () => {
    if (!user) { navigate('/login'); return }
    const basePrice = game.discount_price > 0 ? game.discount_price : game.price
    const uniqueCode = Math.floor(Math.random() * 899) + 100
    const finalAmount = (Math.floor(basePrice / 1000) * 1000) + uniqueCode
    await supabase.from('cart').upsert(
      { user_id: user.id, game_id: game.id },
      { onConflict: 'user_id, game_id', ignoreDuplicates: true }
    )
    fetchCartCount()
    setPaymentAmount(finalAmount)
    setPaymentOpen(true)
  }

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return }
    const { data: items } = await supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id)
    if (!items?.length) return alert('Cart is empty!')
    const subtotal = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0)
    const uniqueCode = Math.floor(Math.random() * 899) + 100
    setPaymentAmount(subtotal + uniqueCode)
    setCartOpen(false)
    setPaymentOpen(true)
  }

  const handleAutoInstall = () => {
    if (!localStorage.getItem('gvr_engine_installed')) {
      setShowEngineWarning(true)
      return
    }

    setIsInstalling(true)
    setInstallStep(0)
    const scriptUrl = `${window.location.origin}/voratools.ps1`
    
    // Base64 encode parameters for safety in URI
    const sBase64 = btoa(scriptUrl).replace(/=/g, '%3D')
    const lBase64 = btoa(game.voratools_link).replace(/=/g, '%3D')
    const a = game.steam_appid || '0'
    
    const gvrUrl = `gvr://install/?s=${sBase64}&l=${lBase64}&a=${a}`
    
    // Industry standard hack to detect if Custom Protocol failed (user lied)
    // When custom protocol launches, browser loses focus.
    const failTimeout = setTimeout(() => {
      if (document.hasFocus()) {
        setIsInstalling(false)
        localStorage.removeItem('gvr_engine_installed')
        setShowEngineWarning(true)
      }
    }, 2500)

    window.addEventListener('blur', () => {
      clearTimeout(failTimeout)
    }, { once: true })

    // Trigger the custom protocol
    window.location.href = gvrUrl

    const step1 = setTimeout(() => setInstallStep(1), 3000)
    const step2 = setTimeout(() => setInstallStep(2), 7000)
    const step3 = setTimeout(() => setInstallStep(3), 14000)

    // Cleanup timeouts if component unmounts or failed
    window.addEventListener('focus', () => {
      if (!localStorage.getItem('gvr_engine_installed')) {
        clearTimeout(step1); clearTimeout(step2); clearTimeout(step3);
      }
    }, { once: true })
  }

  const proceedToInstall = () => {
    localStorage.setItem('gvr_engine_installed', 'true')
    setShowEngineWarning(false)
    handleAutoInstall()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-1 border-[3px] border-transparent border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-[2px] border-transparent border-b-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 animate-pulse">Syncing Intelligence...</p>
        </div>
      </div>
    )
  }

  if (!game) return null

  const basePrice = game.discount_price > 0 ? game.discount_price : game.price
  const icons = { box: '📦', tool: '🔧', guide: '📖', fix: '🛠️' }
  const hasDiscount = game.discount_price > 0
  const discountPercent = hasDiscount ? Math.round((1 - game.discount_price / game.price) * 100) : 0

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-600/3 rounded-full blur-[120px]" />
      </div>

      <Navbar />
      <BottomNav />

      <main className="max-w-7xl mx-auto pt-28 pb-48 px-6 relative">
        <div className="flex items-center gap-3 mb-8 text-[8px] font-black uppercase tracking-widest text-gray-600 animate-fade-in">
          <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          <span className="text-gray-800">/</span>
          <Link to="/#store" className="hover:text-purple-400 transition-colors">Vault</Link>
          <span className="text-gray-800">/</span>
          <span className="text-purple-400">{game.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-[50px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] border border-white/[0.06] aspect-[4/5] relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              <div className="absolute bottom-8 left-8 flex items-center gap-3">
                <span className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/30">
                  {game.genre || 'License'}
                </span>
                {hasDiscount && (
                  <span className="px-4 py-2.5 bg-red-600/90 backdrop-blur-xl rounded-2xl text-[10px] font-black tracking-widest shadow-xl animate-pulse">
                    -{discountPercent}%
                  </span>
                )}
              </div>
              <div className="absolute top-6 left-6 flex items-center gap-2">
                {game.connectivity_type === 'Online' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/70 backdrop-blur-xl rounded-lg text-[8px] font-black uppercase tracking-wider border border-blue-400/20">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/70 backdrop-blur-xl rounded-lg text-[8px] font-black uppercase tracking-wider border border-green-400/20">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Offline
                  </span>
                )}
              </div>
            </div>

            <div className="glass-card-premium p-8 rounded-[40px] space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/30" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">System Intel Required</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-6 bg-white/[0.03] rounded-[30px] border border-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-5 h-5 rounded-lg bg-gray-800 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Minimal Access</span>
                  </div>
                  <ul className="text-[11px] space-y-3 text-gray-300 font-medium">
                    {['os', 'cpu', 'ram', 'gpu'].map(s => (
                      <li key={s} className="flex items-start md:items-center gap-3">
                        <span className="inline-block w-10 shrink-0 text-gray-600 uppercase text-[8px] font-black tracking-wider pt-1 md:pt-0">{s}</span>
                        <span className="w-2 h-[1px] bg-white/[0.06] shrink-0 mt-2 md:mt-0" />
                        <span className="flex-1 break-words leading-tight">{game.specifications?.minimum?.[s] || '-'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-purple-600/[0.03] rounded-[30px] border border-purple-500/10 hover:border-purple-500/20 transition-all">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-5 h-5 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Recommended Sync</span>
                  </div>
                  <ul className="text-[11px] space-y-3 text-gray-300 font-medium">
                    {['os', 'cpu', 'ram', 'gpu'].map(s => (
                      <li key={s} className="flex items-start md:items-center gap-3">
                        <span className="inline-block w-10 shrink-0 text-gray-600 uppercase text-[8px] font-black tracking-wider pt-1 md:pt-0">{s}</span>
                        <span className="w-2 h-[1px] bg-purple-500/10 shrink-0 mt-2 md:mt-0" />
                        <span className="flex-1 break-words leading-tight">{game.specifications?.recommended?.[s] || '-'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {game.is_trending && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600/15 text-red-400 rounded-full text-[7px] font-black uppercase tracking-wider border border-red-500/20">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                        Trending
                      </span>
                    )}
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{game.connectivity_type}</span>
                  </div>
                  <h1 className="font-black italic uppercase leading-none text-4xl sm:text-5xl md:text-7xl tracking-tighter break-words hyphens-auto">{game.title}</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-baseline gap-4">
                  <p className="text-5xl font-black italic tracking-tighter text-gradient">
                    {basePrice === 0 ? 'FREE' : formatRupiah(basePrice)}
                  </p>
                  {hasDiscount && (
                    <span className="text-xl text-gray-600 line-through font-bold">{formatRupiah(game.price)}</span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-red-600/20 animate-pulse">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            <div className="glass-card-premium p-10 rounded-[45px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Vault Description</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg font-medium opacity-90">{game.description}</p>
            </div>

            {status === 'approved' ? (
              <>
                <div className="w-full bg-gradient-to-r from-green-600/10 to-green-500/5 text-green-400 p-7 rounded-[32px] text-center border border-green-500/20 font-black uppercase text-[11px] italic animate-fade-in flex items-center justify-center gap-3 shadow-lg shadow-green-500/5">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Game sudah masuk ke library
                </div>

                <div className="space-y-8 pt-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-[1px] bg-gradient-to-r from-purple-500 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Authorized Links</span>
                        <div className="flex-1 h-[1px] bg-gradient-to-l from-purple-500/30 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {game.download_links?.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/[0.06] rounded-3xl hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-500/5 hover:border-purple-500/30 transition-all duration-300 group active-scale">
                            <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-600/20 transition-all">
                                <span className="text-lg">{icons[link.icon] || 'Link'}</span>
                              </div>
                              <div className="flex flex-col text-left min-w-0 flex-1 pr-2">
                                <span className="text-[7px] font-black uppercase text-gray-600 tracking-widest truncate">Cloud Access</span>
                                <span className="text-xs md:text-sm font-bold uppercase mt-0.5 truncate">{link.label}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-purple-400 group-hover:text-white transition-colors">GET</span>
                              <div className="w-8 h-8 bg-white/[0.03] rounded-xl flex items-center justify-center group-hover:bg-purple-600/30 transition-all">
                                <svg className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>
                            </div>
                          </a>
                        ))}
                        {game.voratools_link && (
                          <div className="flex flex-col gap-3">
                            <button onClick={handleAutoInstall}
                              className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-3xl hover:from-purple-600/20 hover:to-blue-600/20 hover:border-purple-400/50 transition-all duration-300 group active-scale">
                              <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-1">
                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-600/30 transition-all">
                                  <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <div className="flex flex-col text-left min-w-0 flex-1 pr-2">
                                  <span className="text-[7px] font-black uppercase text-purple-400 tracking-widest truncate">VoraTools Auto Install</span>
                                  <span className="text-xs md:text-sm font-bold uppercase mt-0.5 text-white truncate">1-Click Install</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-purple-400 group-hover:text-white transition-colors">START</span>
                                <div className="w-8 h-8 bg-white/[0.03] rounded-xl flex items-center justify-center group-hover:bg-purple-600/40 transition-all">
                                  <svg className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </button>
                            <a href="/GVREngine_Setup.bat" download
                              className="text-[9px] text-center text-gray-500 hover:text-purple-400 underline decoration-purple-500/30 underline-offset-4 transition-colors">
                              Belum pasang GVR Engine? Download Setup (1x Install)
                            </a>
                          </div>
                        )}
                      </div>

                      {game.manual_guide && (
                        <div className="glass-card-premium p-8 rounded-[40px] mt-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-[50px] pointer-events-none" />
                          <div className="flex items-center gap-2 mb-5">
                            <div className="w-5 h-5 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em]">Installation Guide</span>
                          </div>
                          <div className="text-[13px] text-gray-400 leading-relaxed whitespace-pre-line font-medium pl-6 md:pl-8 border-l border-yellow-500/10 break-words">
                            {game.manual_guide}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </>
            ) : status === 'pending' ? (
              <div className="w-full bg-yellow-500/10 text-yellow-400 p-7 rounded-[32px] text-center border border-yellow-500/20 font-black uppercase text-[11px] italic animate-fade-in flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/5">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                Menunggu Verifikasi Admin
              </div>
            ) : (
              <div className="hidden md:flex gap-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <button onClick={() => addToCart(game.id)}
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] py-6 rounded-[30px] font-black text-xs uppercase active-scale hover:bg-white/[0.06] hover:border-purple-500/30 transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
                <button onClick={handleBuy}
                  className="flex-[2] bg-gradient-to-r from-white to-gray-100 text-black py-6 rounded-[30px] font-black text-xs uppercase active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-[0_20px_50px_-15px_rgba(255,255,255,0.25)] hover:shadow-[0_20px_60px_-10px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 group">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Instant Unlock Access
                </button>
              </div>
            )}

            <section className="pt-16 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Community <span className="text-gradient">Feedback</span>
                </h3>
                <div className="bg-white/[0.03] border border-white/[0.08] px-5 py-2.5 rounded-2xl flex items-center gap-3 hover:border-yellow-500/20 transition-all">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-black text-yellow-400">{avgRating}</span>
                </div>
              </div>

              {user && (
                <div className="glass-card-premium p-8 rounded-[40px] space-y-8">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Rate your vault experience</p>
                  </div>
                  <div className="flex justify-center md:justify-start gap-3">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n}
                        onClick={() => setSelectedRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`text-3xl md:text-4xl transition-all duration-200 active-scale ${
                          (hoverRating || selectedRating) >= n
                            ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                            : 'text-gray-700 hover:text-yellow-500/50'
                        }`}>
                        ★
                      </button>
                    ))}
                    {selectedRating > 0 && (
                      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest self-center ml-2">{selectedRating}/5</span>
                    )}
                  </div>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows="4"
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[30px] p-6 text-sm outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all font-medium text-white placeholder:text-gray-700 resize-none"
                    placeholder="Write a secure transmission..." />
                  <button onClick={submitReview} disabled={submittingReview}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest active-scale shadow-xl hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-300 disabled:opacity-50">
                    {submittingReview ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        TRANSMITTING
                      </span>
                    ) : 'Post Transmission'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 bg-white/[0.02] rounded-full animate-ping" />
                      <div className="absolute inset-2 bg-white/[0.03] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-gray-600 uppercase text-[10px] font-black tracking-widest italic">No Feedback Yet</p>
                    <p className="text-gray-800 text-[8px] font-black uppercase tracking-wider mt-2">Be the first to review</p>
                  </div>
                ) : (
                  reviews.map((rev, i) => (
                    <div key={rev.id} className="glass-card p-6 rounded-[30px] border border-white/[0.04] animate-slide-up transition-all duration-300 hover:border-white/[0.08]" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 p-[2px]">
                            <img src={rev.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${rev.profiles?.full_name || 'Hunter'}&background=0C0C0E&color=A855F7&size=64`}
                              className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase leading-tight">{rev.profiles?.full_name || 'Vault Hunter'}</p>
                            <p className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">{new Date(rev.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2.5 py-1.5 rounded-xl">
                          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[9px] font-black text-yellow-400">{rev.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium pl-[3.25rem]">{rev.comment || 'No comment.'}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {status !== 'approved' && status !== 'pending' && (
        <div className="md:hidden fixed bottom-[calc(72px+var(--sab))] left-0 right-0 z-[2000]">
          <div className="bg-gradient-to-t from-[#030303] via-[#030303]/95 to-transparent px-6 pt-12 pb-4">
            <div className="flex gap-4">
              <button onClick={() => addToCart(game.id)}
                className="flex-1 bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] py-5 rounded-2xl font-black text-[11px] uppercase active-scale hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Cart
              </button>
              <button onClick={handleBuy}
                className="flex-[2.5] bg-gradient-to-r from-purple-600 to-purple-500 py-5 rounded-2xl font-black text-[11px] uppercase active-scale shadow-[0_15px_40px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_60px_rgba(168,85,247,0.6)] transition-all duration-300 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Unlock Access
              </button>
            </div>
          </div>
        </div>
      )}

      <CartModal onCheckout={handleCheckout} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={paymentAmount} />

      {isInstalling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
          <div className="relative w-full max-w-2xl animate-fade-in text-center flex flex-col items-center">
            {installStep < 3 ? (
              <>
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-purple-600/30 rounded-full animate-[spin_3s_linear_infinite]" />
                  <div className="absolute inset-2 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">⚡</span>
                  </div>
                </div>
                
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-gradient">System Integration</h2>
                <div className="flex flex-col gap-2 mb-8 items-center">
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-4 animate-pulse">
                    {installStep === 0 ? 'Mengirim Protokol GVR...' : installStep === 1 ? 'Menunggu engine lokal...' : 'Mengintegrasikan dengan Steam Library...'}
                  </p>
                  <div className="bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border border-purple-500/30">
                    1. Klik "Open" jika browser meminta izin.
                  </div>
                  <div className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border border-blue-500/30">
                    2. Proses akan berjalan otomatis di latar belakang secara gaib.
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-bounce-in flex flex-col items-center">
                <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500/50 mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-green-400 drop-shadow-lg">INSTALLATION SUCCESS</h2>
                <p className="text-[11px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-md">
                  Proses integrasi telah selesai! Game sudah berhasil ditambahkan ke dalam Steam Library kamu. Silakan buka Steam untuk mulai bermain.
                </p>
              </div>
            )}

            <button onClick={() => setIsInstalling(false)}
              className="mt-6 px-10 py-4 bg-white/[0.03] border border-white/10 hover:bg-white/10 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">
              Tutup Layar Ini
            </button>
          </div>
        </div>
      )}

      {showEngineWarning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div className="relative w-full max-w-md bg-[#0a0a0f] border border-purple-500/30 rounded-3xl p-8 text-center animate-fade-in shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30 mx-auto mb-6">
              <span className="text-4xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">GVR Engine Dibutuhkan</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
              Untuk menggunakan fitur 1-Click Install yang instan dan gaib, kamu harus menginstal GVR Engine terlebih dahulu (cukup 1x seumur hidup).
            </p>
            <div className="flex flex-col gap-3">
              <a href="/GVREngine_Setup.bat" download onClick={() => localStorage.setItem('gvr_engine_installed', 'true')}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-colors">
                Download & Install Engine
              </a>
              <button onClick={proceedToInstall}
                className="w-full py-4 bg-white/[0.03] hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors">
                Saya Sudah Menginstalnya
              </button>
            </div>
            <button onClick={() => setShowEngineWarning(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
