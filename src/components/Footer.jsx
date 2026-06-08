import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.03] pt-16 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16 text-center md:text-left">
          <div className="md:col-span-2">
            <h3 className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <svg className="w-7 h-7 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              <span className="text-2xl font-black italic uppercase tracking-tighter text-gradient">GVR</span>
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto md:mx-0">
              Terminal cerdas untuk pengalaman gaming tanpa batas. Temukan, mainkan, dan kuasai game favorit Anda di GameVora.
            </p>
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white mb-6">Navigasi</h4>
            <div className="flex flex-col gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
              <Link to="/#store" className="hover:text-purple-400 transition-colors">Vault</Link>
              <Link to="/request" className="hover:text-purple-400 transition-colors">Request Game</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white mb-6">Bantuan</h4>
            <div className="flex flex-col gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Link to="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link>
              <Link to="/profile" className="hover:text-purple-400 transition-colors">Akun Saya</Link>
              <span className="hover:text-purple-400 transition-colors cursor-pointer">Support</span>
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white mb-6">Sosial Media</h4>
            <div className="flex flex-col gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <a href="https://discord.com/invite/wQg7xuQsSd" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors flex items-center justify-center md:justify-start gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 01-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                Discord
              </a>
              <a href="https://www.tiktok.com/@gamevora.official" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors flex items-center justify-center md:justify-start gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                TikTok
              </a>
              <a href="https://www.instagram.com/gamevora.official/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors flex items-center justify-center md:justify-start gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-8 border-t border-white/[0.03]">
          <div className="flex justify-center gap-4 mb-8">
            <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse-dot" />
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse-dot" style={{ animationDelay: '0.3s' }} />
            <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse-dot" style={{ animationDelay: '0.6s' }} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-700 hover:text-gray-500 transition-colors duration-300 text-center">
            © 2026 GAMEVORA TERMINAL. ALL RIGHTS RESERVED.
          </p>
          <div className="section-divider mt-8" />
        </div>
      </div>
    </footer>
  )
}
