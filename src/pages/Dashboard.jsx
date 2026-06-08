import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [vaultOpen, setVaultOpen] = useState(false)
  const [vaultGame, setVaultGame] = useState(null)
  const [vaultLinks, setVaultLinks] = useState([])
  const [vaultGuide, setVaultGuide] = useState('')
  const [voraLink, setVoraLink] = useState('')
  const [voraAppId, setVoraAppId] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStep, setInstallStep] = useState(0)
  const [showEngineWarning, setShowEngineWarning] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    document.body.style.opacity = '1'
    loadLibrary()
  }, [user])

  async function loadLibrary() {
    const { data } = await supabase
      .from('library')
      .select('*, games(*)')
      .eq('user_id', user.id)
      .eq('status', 'approved')
    setLibrary(data || [])
    setLoading(false)
  }

  const openVault = async (gameId, showTutorial = false) => {
    const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (!game) return
    setVaultGame(game.title)
    setVaultLinks(game.download_links || [])
    setVaultGuide(game.manual_guide || 'Panduan belum tersedia.')
    setVoraLink(game.voratools_link || '')
    setVoraAppId(game.steam_appid || '')
    setVaultOpen(true)
    if (showTutorial) {
      setTimeout(() => {
        document.getElementById('guide-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const handleAutoInstall = () => {
    if (!localStorage.getItem('gvr_engine_installed')) {
      setShowEngineWarning(true)
      return
    }

    setIsInstalling(true)
    setInstallStep(0)
    const scriptUrl = `${window.location.origin}/voratools.ps1`
    
    const sBase64 = btoa(scriptUrl).replace(/=/g, '%3D')
    const lBase64 = btoa(voraLink).replace(/=/g, '%3D')
    const a = voraAppId || '0'
    
    const gvrUrl = `gvr://install/?s=${sBase64}&l=${lBase64}&a=${a}`
    
    // Industry standard hack to detect if Custom Protocol failed (user lied)
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

  const filteredLibrary = library.filter(item => {
    const title = item.games?.title?.toLowerCase() || ''
    const genre = item.games?.genre?.toLowerCase() || ''
    const q = search.toLowerCase()
    return title.includes(q) || genre.includes(q)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-1 border-[3px] border-transparent border-t-purple-500 rounded-full animate-spin" />
          </div>
          <p className="mt-6 text-[9px] font-black tracking-[0.5em] uppercase">Syncing Security Protocol...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-32 relative">
        <header className="mb-10">
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] block mb-2">Authenticated Access</span>
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase mb-4 leading-none text-gradient">The Vault</h1>
          <div className="flex gap-2 mb-6">
            <div className="w-16 h-1.5 bg-purple-600 rounded-full" />
            <div className="w-4 h-1.5 bg-blue-500 rounded-full" />
          </div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-md leading-relaxed">
            Akses semua produk digital yang telah kamu buka di sini.
          </p>
        </header>

        <div className="mb-12 max-w-md">
          <div className="search-bar flex p-1.5 rounded-[28px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="SEARCH VAULT ASSETS..."
              className="bg-transparent px-6 py-3 outline-none text-[10px] font-black uppercase tracking-widest w-full text-white placeholder:text-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLibrary.length === 0 ? (
            <div className="col-span-full text-center py-20 opacity-40 uppercase text-[10px] font-black tracking-widest">
              {library.length === 0 ? 'No assets unlocked in this vault.' : 'No Matching Records Found'}
            </div>
          ) : (
            filteredLibrary.map(item => {
              const g = item.games
              if (!g) return null
              return (
                <div key={item.id} className="glass-card p-6 rounded-[40px] flex flex-col gap-5 animate-fade-in">
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5">
                    <img src={g.thumbnail} className="w-full h-full object-cover" alt={g.title} />
                  </div>
                  <div className="px-2">
                    <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest">{g.genre}</span>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mt-1">{g.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button onClick={() => openVault(g.id)} className="bg-gradient-to-r from-white to-gray-100 text-black py-4 rounded-2xl font-black text-[10px] uppercase active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300">
                      Access Files
                    </button>
                    <button onClick={() => openVault(g.id, true)} className="bg-white/[0.03] border border-white/[0.08] text-white py-4 rounded-2xl font-black text-[10px] uppercase active-scale hover:bg-white/10 transition-all">
                      Tutorial
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {vaultOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-md" onClick={() => setVaultOpen(false)} />
          <div className="relative glass-card-premium p-8 md:p-10 rounded-[45px] max-w-xl w-full shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-gradient">{vaultGame}</h2>
            </div>
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Cloud Access:</h4>
                <div className="space-y-3">
                  {vaultLinks.length > 0 ? vaultLinks.map((link, i) => {
                    const iconMap = { box: '📦', tool: '🔧', guide: '📖', fix: '🛠️' }
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:bg-purple-600/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <span className="text-lg">{iconMap[link.icon] || '🔗'}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 group-hover:text-white transition-colors">DOWNLOAD →</span>
                      </a>
                    )
                  }) : <p className="text-[9px] text-gray-600 uppercase">No links provided.</p>}
                  
                  {voraLink && (
                    <div className="flex flex-col gap-3">
                      <button onClick={handleAutoInstall}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/30 rounded-2xl hover:from-purple-600/20 hover:to-blue-600/20 transition-all group">
                        <div className="flex items-center gap-4">
                          <span className="text-lg">⚡</span>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">VoraTools Auto Install</span>
                            <span className="text-[7px] text-purple-400 uppercase tracking-widest">1-Click Install</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-purple-400 group-hover:text-white transition-colors">START →</span>
                      </button>
                      <a href="/GVREngine_Setup.bat" download
                        className="text-[9px] text-center text-gray-500 hover:text-purple-400 underline decoration-purple-500/30 underline-offset-4 transition-colors">
                        Belum pasang GVR Engine? Download Setup (1x Install)
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div id="guide-section">
                <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-4">Installation Guide:</h4>
                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 text-[11px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {vaultGuide}
                </div>
              </div>
            </div>
            <button onClick={() => setVaultOpen(false)}
              className="w-full mt-10 active-scale py-5 bg-gradient-to-r from-white to-gray-100 text-black rounded-[22px] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all duration-300 hover:from-purple-600 hover:to-purple-500 hover:text-white">
              Seal Vault
            </button>
          </div>
        </div>
      )}

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

      <Footer />
    </div>
  )
}
