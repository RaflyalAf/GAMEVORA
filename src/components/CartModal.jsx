import { useCart } from '../contexts/CartContext'
import { formatRupiah } from '../lib/utils'

export default function CartModal({ onCheckout }) {
  const { cartOpen, closeCart, cartItems, removeFromCart } = useCart()

  if (!cartOpen) return null

  const total = cartItems.reduce((sum, item) => {
    const p = item.games?.discount_price || item.games?.price || 0
    return sum + p
  }, 0)

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeCart} />
      <div className="relative bg-gradient-to-b from-[#0c0c0e] to-[#08080a] border border-white/[0.06] p-8 md:p-10 rounded-[45px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.8)] animate-slide-up">
        <div className="flex justify-between items-center mb-8 border-b border-white/[0.04] pb-5">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">
            Cart <span className="text-gradient">Vault</span>
          </h3>
          <button onClick={closeCart} className="text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
            Close
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 no-scrollbar mb-8 pr-2">
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4 opacity-10">Empty</div>
              <p className="text-gray-600 uppercase text-[10px] font-black tracking-widest italic">Empty Cart</p>
            </div>
          ) : (
            cartItems.map(item => {
              const p = item.games?.discount_price || item.games?.price || 0
              return (
                <div key={item.id} className="flex items-center justify-between bg-white/[0.02] p-4 rounded-3xl border border-white/[0.04] hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/[0.04]">
                      <img src={item.games?.thumbnail} className="w-full h-full object-cover" alt={item.games?.title} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase leading-tight">{item.games?.title}</p>
                      <p className="text-[10px] font-bold text-purple-400 mt-1">{formatRupiah(p)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-400 p-2 active-scale transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-6 border-t border-white/[0.04] space-y-5">
          <div className="flex justify-between items-end px-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subtotal</p>
            <p className="text-3xl font-black text-purple-400 italic tracking-tight">{formatRupiah(total)}</p>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-5 rounded-[24px] font-black text-[11px] uppercase tracking-wider active-scale shadow-xl hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-purple-600/20"
          >
            Secure Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
