import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import SocialFloat from '../components/SocialFloat'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/3 rounded-full blur-[150px]" />
      </div>

      <Navbar />
      
      <div className="flex-grow flex items-center justify-center relative max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-24 w-full">
        <div className="animate-fade-in relative z-10 w-full">
          <div className="text-center mb-16 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Welcome to the Future of Gaming</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-6 leading-tight">
              Play Premium Games <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                Without Limits.
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-gray-400 font-bold uppercase tracking-widest text-[11px] md:text-[12px] leading-loose mb-12">
              GameVora adalah platform revolusioner yang memberimu akses ke ribuan game PC original di Steam dengan harga yang sangat terjangkau. Tidak perlu lagi membajak, mainkan game favoritmu secara resmi!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {user ? (
                <Link to="/store" className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-black text-[12px] uppercase tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] active-scale transition-all">
                  Masuk ke Vault / Store
                </Link>
              ) : (
                <>
                  <Link to="/register" className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-black text-[12px] uppercase tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] active-scale transition-all">
                    Mulai Bermain Sekarang
                  </Link>
                  <Link to="/login" className="px-10 py-5 bg-white/[0.03] border border-white/10 rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-white/10 active-scale transition-all text-white">
                    Login ke Akun
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {[
              { icon: '⚡', title: '1-Click Install', desc: 'Teknologi VoraTools mengintegrasikan game langsung ke Steam Library-mu secara gaib hanya dengan satu klik.' },
              { icon: '🛡️', title: '100% Original', desc: 'Bukan game bajakan. Nikmati fitur resmi Steam, Update Otomatis, dan Multiplayer Online tanpa batas.' },
              { icon: '💾', title: 'Cloud Sync', desc: 'Semua progress permainanmu (Save Data) tersimpan aman secara otomatis di server Steam Cloud.' },
              { icon: '💰', title: 'Hemat 90%', desc: 'Mainkan game-game AAA dengan harga super murah. Kualitas premium tanpa menguras dompet.' }
            ].map((feat, i) => (
              <div key={i} className="glass-card-premium p-8 rounded-[32px] hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-14 h-14 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-purple-500/20 group-hover:border-purple-500/50 transition-all duration-500">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-3 text-white group-hover:text-purple-300 transition-colors">{feat.title}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-relaxed font-bold group-hover:text-gray-400 transition-colors">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SocialFloat />
      <ChatWidget />
      <BottomNav />
      <Footer />
    </div>
  )
}
