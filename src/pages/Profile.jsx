import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [library, setLibrary] = useState([])
  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)

  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialTitle, setTutorialTitle] = useState('')
  const [tutorialContent, setTutorialContent] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    initProfile()
  }, [user])

  async function initProfile() {
    const [profileRes, libraryRes, settingsRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('library').select('*, games(*)').eq('user_id', user.id).eq('status', 'approved'),
      supabase.from('library').select('*, games(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    const p = profileRes.data
    setProfile(p)
    setLibrary(libraryRes.data || [])
    setOrders(ordersRes.data || [])

    setFullName(p?.full_name || '')
    setUsername(p?.username || '')
    setAvatarUrl(p?.avatar_url || '')

    fetchWishlist()
  }

  async function fetchWishlist() {
    const { data } = await supabase.from('cart').select('*, games(*)').eq('user_id', user.id)
    setWishlist(data || [])
  }

  const saveProfile = async () => {
    if (!fullName.trim()) return alert('Full Name cannot be empty!')
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, username, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
    })
    if (error) {
      alert('Sync Error: ' + error.message)
    } else {
      alert('Vault Identity Synchronized!')
      initProfile()
    }
    setSaving(false)
  }

  const updatePassword = async () => {
    if (!newPass || newPass !== confirmPass) return alert('Passwords do not match!')
    if (newPass.length < 6) return alert('Password too weak!')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) return alert(error.message)
    alert('Security Key Updated!')
    setNewPass('')
    setConfirmPass('')
  }

  const showTutorial = async (gameId) => {
    const { data: game } = await supabase.from('games').select('title, manual_guide').eq('id', gameId).single()
    if (!game) return alert('Failed to load guide.')
    setTutorialTitle(`MANUAL: ${game.title}`)
    setTutorialContent(game.manual_guide || 'Belum ada panduan untuk arsip ini.')
    setTutorialOpen(true)
  }

  const totalSpending = orders.filter(o => o.status === 'approved').reduce((acc, curr) => acc + (Number(curr.games?.discount_price || curr.games?.price) || 0), 0)

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
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-1">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card-premium p-8 rounded-[35px] text-center">
            <p className="text-3xl font-black italic text-purple-400">{orders.length}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Orders</p>
          </div>
          <div className="glass-card-premium p-8 rounded-[35px] text-center">
            <p className="text-3xl font-black italic text-blue-400">{formatRupiah(totalSpending)}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Spending</p>
          </div>
          <div className="glass-card-premium p-8 rounded-[35px] text-center">
            <p className="text-3xl font-black italic text-green-400">{library.length}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Collection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">My Games</h3>
            {library.length === 0 ? (
              <p className="opacity-30 text-center py-10 text-[10px] font-black uppercase italic">No collection found</p>
            ) : (
              library.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/[0.05] hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-4">
                    <img src={item.games?.thumbnail} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" alt={item.games?.title} />
                    <div>
                      <h5 className="text-[11px] font-black uppercase leading-tight">{item.games?.title || 'Unknown'}</h5>
                      <p className="text-[8px] text-purple-400 font-bold uppercase mt-1 tracking-widest">Vault Granted</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => showTutorial(item.games?.id)} className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-full font-black text-[8px] uppercase border border-yellow-500/20 active-scale hover:bg-yellow-500/20 transition-all">Tutorial</button>
                    <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-white text-black rounded-full font-black text-[8px] uppercase active-scale hover:bg-purple-600 hover:text-white transition-all">Access</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Wishlist</h3>
            {wishlist.length === 0 ? (
              <p className="opacity-30 text-center py-10 text-[10px] font-black uppercase italic">Wishlist is empty</p>
            ) : (
              wishlist.map(item => (
                <div key={item.id} className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-3xl flex items-center justify-between hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-4">
                    <img src={item.games?.thumbnail} className="w-10 h-10 rounded-xl object-cover border border-white/5" alt={item.games?.title} />
                    <div>
                      <h4 className="text-[10px] font-black uppercase leading-tight">{item.games?.title || 'Unknown'}</h4>
                      <p className="text-[8px] text-pink-500 font-bold uppercase mt-0.5">Stored in Cart</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/')} className="px-4 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase active-scale shadow-lg hover:bg-purple-600 hover:text-white transition-all">VIEW</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card-premium p-8 rounded-[40px] space-y-8 mb-10">
          <h3 className="text-lg font-black uppercase italic tracking-tighter">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                  <th className="pb-4 px-2">ID</th>
                  <th className="pb-4 px-2">Item</th>
                  <th className="pb-4 px-2 text-center">Status</th>
                  <th className="pb-4 px-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody id="transaction-list">
                {orders.length === 0 ? (
                  <tr><td colSpan="4" className="py-10 text-center opacity-20 text-[10px] font-black uppercase italic tracking-widest">No Signals Detected</td></tr>
                ) : (
                  orders.map(order => {
                    const statusColor = order.status === 'approved' ? 'text-green-500 bg-green-500/10 border-green-500/20' : order.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'
                    return (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter">#GV-{order.id?.split('-')?.[0]?.toUpperCase()}</td>
                        <td className="py-5 px-2">
                          <p className="text-[10px] font-black uppercase truncate max-w-[150px] leading-none">{order.games?.title || 'Unknown'}</p>
                          <p className="text-[8px] font-bold text-purple-400 mt-1">Rp {Number(order.games?.discount_price || order.games?.price || 0).toLocaleString('id-ID')}</p>
                        </td>
                        <td className="py-5 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-[7px] font-black border uppercase ${statusColor}`}>{order.status}</span>
                        </td>
                        <td className="py-5 px-2 text-right text-[8px] font-bold text-gray-600 uppercase">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Identity Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Avatar URL</label>
                <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 disabled:opacity-50">
                {saving ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    SYNCING
                  </span>
                ) : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
              </div>
              <button onClick={updatePassword}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300">
                Update Password
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button onClick={signOut}
            className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-10 py-5 rounded-[30px] font-black text-[11px] uppercase tracking-widest active-scale hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </main>

      {tutorialOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setTutorialOpen(false)} />
          <div className="relative glass-card-premium p-8 rounded-[45px] max-w-lg w-full max-h-[75vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-gradient">{tutorialTitle}</h2>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line font-medium">{tutorialContent}</p>
            <button onClick={() => setTutorialOpen(false)}
              className="w-full mt-8 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase active-scale border border-white/10 hover:bg-white/10 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
