import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'

const faqs = [
  { q: 'Apa itu GameVora?', a: 'GameVora adalah platform digital vault yang menyediakan akses ke berbagai game dan software legal dengan harga terjangkau.' },
  { q: 'Bagaimana cara membeli game?', a: 'Tambah game ke cart, lakukan pembayaran via QRIS, upload bukti transfer, dan AI kami akan memverifikasi secara otomatis.' },
  { q: 'Bagaimana cara download setelah bayar?', a: 'Setelah pembayaran diverifikasi, game akan muncul di halaman Vault (Dashboard). Klik game tersebut untuk mengakses link download.' },
  { q: 'Kenapa game tidak muncul di library?', a: 'Pastikan pembayaran sudah diverifikasi. Jika status masih pending, hubungi admin melalui chat support.' },
  { q: 'Apakah ada garansi?', a: 'Ya, setiap pembelian memiliki garansi akses 30 hari. Jika ada kendala, hubungi support kami.' },
]

export default function FAQ() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="max-w-4xl mx-auto pt-32 px-6 pb-32 relative">
        <div className="text-center mb-16">
          <span className="text-purple-500 text-[10px] font-black uppercase tracking-[0.5em]">Signal Base</span>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mt-4 mb-4 text-gradient">FAQ</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] max-w-lg mx-auto">
            Frequently Asked Questions tentang layanan GameVora.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group glass-card-premium rounded-[30px] overflow-hidden transition-all duration-300">
              <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
                <span className="text-sm md:text-base font-black uppercase tracking-tight pr-4">{faq.q}</span>
                <svg className="w-5 h-5 text-purple-500 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="w-full h-px bg-white/5 mb-6" />
                <p className="text-gray-400 text-sm leading-relaxed font-medium">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
