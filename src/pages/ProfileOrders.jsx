import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileOrders() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    
    const fetchOrders = () => {
      supabase.from('library').select('*, games(title)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        setOrders(data || [])
      })
    }
    
    fetchOrders()
    
    const channel = supabase.channel('profile_orders_page_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: 'user_id=eq.' + user.id }, fetchOrders)
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const cetakStruk = (order) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            @page { margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              background: #fff;
              color: #000;
              padding: 20px;
              font-size: 12px;
              line-height: 1.5;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              border: 2px dashed #000;
              padding: 24px 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .header h1 {
              font-size: 20px;
              letter-spacing: 2px;
              font-weight: 900;
            }
            .header p {
              font-size: 9px;
              color: #555;
              margin-top: 4px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .row.label {
              color: #555;
              font-size: 10px;
            }
            .total {
              border-top: 2px solid #000;
              margin-top: 8px;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              font-weight: 900;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 16px;
              padding-top: 12px;
              border-top: 2px solid #000;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .status-approved { color: #16a34a; font-weight: 900; }
            .status-pending { color: #ca8a04; font-weight: 900; }
            .status-rejected { color: #dc2626; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style={{ width: '24px', height: '24px', color: '#a855f7' }} fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                GVR
              </h1>
              <p>Vault Digital Receipt</p>
            </div>
            <div class="row label">
              <span>Order ID</span>
              <span>#GV-${order.id?.split('-')?.[0]?.toUpperCase()}</span>
            </div>
            <div class="row label">
              <span>Date</span>
              <span>${new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="divider"></div>
            <div class="row">
              <span>${order.games?.title || order.item_name || 'Package'}</span>
              <span>—</span>
            </div>
            <div class="row label">
              <span>Qty: 1</span>
              <span></span>
            </div>
            <div class="divider"></div>
            <div class="total">
              <span>TOTAL</span>
              <span>—</span>
            </div>
            <div style="margin-top: 8px; text-align: center;">
              <span class="status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="footer">
              Terima kasih telah berbelanja<br>
              Vault Anda telah dipercayakan kepada kami
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
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
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">Transaction History</h1>
        </div>

        <div className="glass-card-premium p-8 rounded-[40px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                  <th className="pb-4 px-2 whitespace-nowrap">ID Pesanan</th>
                  <th className="pb-4 px-2 whitespace-nowrap">Game</th>
                  <th className="pb-4 px-2 text-center whitespace-nowrap">Jml</th>
                  <th className="pb-4 px-2 whitespace-nowrap">Tanggal</th>
                  <th className="pb-4 px-2 text-right whitespace-nowrap">Harga</th>
                  <th className="pb-4 px-2 text-center whitespace-nowrap">Status</th>
                  <th className="pb-4 px-2 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="7" className="py-10 text-center opacity-20 text-[10px] font-black uppercase italic tracking-widest">No Signals Detected</td></tr>
                ) : (
                  orders.map(order => {
                    const displayStatus = order.status === 'approved' ? 'success' : order.status === 'rejected' ? 'failed' : order.status
                    const statusColor = displayStatus === 'success' ? 'text-green-500 bg-green-500/10 border-green-500/20' : displayStatus === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                          #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                        </td>
                        <td className="py-5 px-2">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase truncate max-w-[120px] leading-none">{order.games?.title || 'Unknown'}</p>
                            {order.is_giveaway && (
                              <span className="px-1.5 py-0.5 rounded text-[6px] font-black border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 uppercase tracking-wider leading-none">Giveaway</span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-2 text-center text-[10px] font-bold text-gray-400">1</td>
                        <td className="py-5 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-5 px-2 text-right text-[10px] font-black text-purple-400 whitespace-nowrap">—</td>
                        <td className="py-5 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-[7px] font-black border uppercase ${statusColor}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-center">
                          <button onClick={() => cetakStruk(order)}
                            className="px-3 py-2 bg-white/[0.05] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-wider text-gray-400 hover:text-purple-300 transition-all active-scale whitespace-nowrap">
                            Cetak Struk
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
