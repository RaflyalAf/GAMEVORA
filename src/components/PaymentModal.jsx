import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { formatRupiah } from '../lib/utils'
import { supabase } from '../lib/supabase'

export default function PaymentModal({ open, onClose, amount }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef(null)
  const { user } = useAuth()
  const { fetchCartCount } = useCart()
  const navigate = useNavigate()

  if (!open) return null

  const handlePayment = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return alert('Upload receipt first!')
    if (!amount) return alert('No pending payment!')
    setLoading(true)

    try {
      setStep('UPLOADING PROOF...')
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('payments').upload(`proofs/${fileName}`, file)
      if (uploadError) throw new Error('Upload gagal: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`)

      setStep('SYNCING ORDERS...')
      const { data: items, error: cartError } = await supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id)
      if (cartError) throw new Error('Gagal memuat keranjang: ' + cartError.message)

      if (!items?.length) {
        alert('Cart is empty!')
        setLoading(false)
        setStep('')
        return
      }

      for (const item of items) {
        const { error: insertError } = await supabase.from('library').upsert({
          user_id: user.id, game_id: item.game_id, status: 'pending', payment_proof: publicUrl
        }, { onConflict: 'user_id, game_id' })
        if (insertError) throw new Error('Gagal memproses pesanan: ' + insertError.message)

        await supabase.from('vault_notifications').insert([{
          user_id: user.id, title: 'Payment Pending',
          message: `Pembayaran untuk ${item.games?.title || 'Game'} sedang menunggu verifikasi admin.`
        }])
      }

      setStep('CLEANING CART...')
      const { error: deleteError } = await supabase.from('cart').delete().eq('user_id', user.id)
      if (deleteError) throw new Error('Gagal membersihkan keranjang: ' + deleteError.message)

      fetchCartCount()
      setDone(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  const closeAndGo = () => {
    setDone(false)
    onClose()
    navigate('/profile/orders')
  }

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={done ? closeAndGo : onClose} />
      <div className="relative glass-card-premium p-10 rounded-[45px] max-w-md w-full shadow-2xl text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

        {done ? (
          <>
            <div className="w-20 h-20 bg-green-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black italic uppercase mb-3 tracking-tighter text-gradient">Payment Submitted</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
              Bukti pembayaran telah dikirim.<br />
              Admin akan memverifikasi dalam waktu 1x24 jam.<br />
              Silakan cek halaman Orders untuk status terbaru.
            </p>
            <button onClick={closeAndGo}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase active-scale shadow-xl hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-300">
              Lihat Orders
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black italic uppercase mb-8 tracking-tighter text-gradient">Vault Transaction</h2>
            <div className="bg-white/[0.03] p-8 rounded-[35px] border border-white/[0.06] mb-8">
              <div className="bg-white p-4 rounded-3xl mx-auto mb-6 w-52 h-52 flex items-center justify-center shadow-2xl">
                <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-full object-contain" />
              </div>
              <p className="text-4xl font-black text-purple-400 italic">{formatRupiah(amount)}</p>
              <p className="text-[8px] text-red-500 font-black mt-4 uppercase tracking-widest">NOMINAL WAJIB SAMA PERSIS!</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="w-full bg-white/[0.03] border border-white/[0.08] p-4 rounded-2xl text-[10px] text-gray-400 mb-6 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-all"
            />
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-5 rounded-2xl active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {step || 'PROCESSING'}
                </span>
              ) : 'Kirim Pembayaran'}
            </button>
            <button onClick={onClose} className="mt-6 text-[10px] text-gray-600 font-black uppercase hover:text-gray-400 transition-colors">
              {loading ? 'WAIT...' : 'Cancel'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
