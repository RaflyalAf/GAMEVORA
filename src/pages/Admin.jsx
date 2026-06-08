import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function Admin() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [games, setGames] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [users, setUsers] = useState([])
  const [proofPreview, setProofPreview] = useState(null)
  const [userOrders, setUserOrders] = useState(null)
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [chatUsers, setChatUsers] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastType, setBroadcastType] = useState('info')

  const [searchGames, setSearchGames] = useState('')
  const [searchUsers, setSearchUsers] = useState('')
  const [searchRequests, setSearchRequests] = useState('')

  const [editId, setEditId] = useState('')
  const [uploadingZip, setUploadingZip] = useState(false)
  const [form, setForm] = useState({
    title: '', genre: 'Action', price: 0, discount_price: 0,
    thumbnail: '', description: '', manual_guide: '',
    is_trending: false, connectivity_type: 'Offline', release_type: 'instant', steam_appid: '', voratools_link: '',
    min_os: '', min_cpu: '', min_ram: '', min_gpu: '',
    rec_os: '', rec_cpu: '', rec_ram: '', rec_gpu: '',
    pixeldrain_1: '', pixeldrain_2: '', pixeldrain_3: '', pixeldrain_4: ''
  })

  useEffect(() => {
    if (loading) return
    if (!isAdmin) { navigate('/'); return }
    fetchGames()
    fetchPendingOrders()
    fetchUsers()
    fetchRequests()
    fetchChats()
  }, [loading])

  useEffect(() => {
    const chatInterval = setInterval(fetchChats, 30000)
    const chatChannel = supabase.channel('admin_chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
      .subscribe()
    const ordersChannel = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library' }, fetchPendingOrders)
      .subscribe()
    const requestsChannel = supabase.channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_requests' }, fetchRequests)
      .subscribe()
    const usersChannel = supabase.channel('admin_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe()
      
    return () => { 
      clearInterval(chatInterval)
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [])

  async function fetchGames() {
    const { data } = await supabase.from('games').select('*').order('created_at', { ascending: false })
    setGames(data || [])
  }



  async function fetchPendingOrders() {
    const { data, error } = await supabase.from('library')
      .select('*, games(title, price, discount_price)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending orders:', error)
      alert('Error fetching orders: ' + error.message)
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(o => o.user_id))]
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      const profileMap = {}
      if (profiles) profiles.forEach(p => { profileMap[p.id] = p })
      setPendingOrders(data.map(o => ({ ...o, profiles: profileMap[o.user_id] || null, item_name: o.games?.title || 'Unknown' })))
    } else {
      setPendingOrders(data || [])
    }
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from('profiles').select('*')
    let profileList = []
    if (error || !data) {
      const { data: fallback } = await supabase.from('profiles').select('*')
      profileList = fallback || []
    } else {
      profileList = data
    }

    const { data: libraryData } = await supabase.from('library').select('user_id, game_id, proof_url, payment_proof, games(title)').eq('status', 'approved')
    const userGames = {}
    if (libraryData) {
      libraryData.forEach(l => {
        const uid = l.user_id
        if (!userGames[uid]) userGames[uid] = { count: 0, names: [], proofs: [] }
        userGames[uid].count++
        if (l.games?.title && !userGames[uid].names.includes(l.games.title)) {
          userGames[uid].names.push(l.games.title)
        }
        const proof = l.payment_proof || l.proof_url
        if (proof && !userGames[uid].proofs.includes(proof)) {
          userGames[uid].proofs.push(proof)
        }
      })
    }

    setUsers(profileList.map(u => ({
      ...u,
      game_count: userGames[u.id]?.count || 0,
      game_names: userGames[u.id]?.names || [],
      proof_urls: userGames[u.id]?.proofs || [],
    })))
  }

  async function fetchRequests() {
    const { data } = await supabase.from('game_requests').select('*').order('created_at', { ascending: false })
    setRequests(data || [])
  }

  async function fetchChats() {
    try {
    const { data } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
    const userMap = {}
    if (data) {
      data.forEach(c => {
        if (!userMap[c.user_id]) {
          const lastRead = (() => { try { return parseInt(localStorage.getItem('chat_read_' + c.user_id)) || 0 } catch { return 0 } })()
          const unread = data.filter(x => x.user_id === c.user_id && !x.is_admin_reply && new Date(x.created_at).getTime() > lastRead)
          userMap[c.user_id] = {
            user_id: c.user_id,
            name: c.sender_name,
            lastMessage: c.message,
            lastTime: c.created_at,
            unread: unread.length,
          }
        }
      })
    }
    setChatUsers(Object.values(userMap))
    } catch (e) { console.error('fetchChats error', e) }
  }

  const loadChatMessages = async (userId) => {
    setSelectedChat(userId)
    const { data } = await supabase.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    setChatMessages(data || [])
    try { localStorage.setItem('chat_read_' + userId, Date.now()) } catch {}
    setTimeout(() => {
      const el = document.getElementById('chat-messages-container')
      if (el) el.scrollTop = el.scrollHeight
    }, 50)
  }

  const sendChatReply = async () => {
    if (!chatInput.trim() || !selectedChat) return
    await supabase.from('chats').insert([{
      user_id: selectedChat,
      sender_name: 'ADMIN',
      message: chatInput.trim(),
      is_admin_reply: true,
    }])
    setChatInput('')
    await loadChatMessages(selectedChat)
    fetchChats()
  }

  const sendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    const channel = supabase.channel('announcements')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'announcement',
          payload: { title: broadcastTitle.trim(), message: broadcastMessage.trim(), type: broadcastType },
        })
        setTimeout(() => supabase.removeChannel(channel), 2000)
      }
    })
    setBroadcastTitle('')
    setBroadcastMessage('')
    setBroadcastType('info')
    alert('Broadcast terkirim!')
  }

  const viewUserOrders = async (userId, userName) => {
    setUserOrdersLoading(true)
    const { data } = await supabase.from('library').select('*, games(title)').eq('user_id', userId).eq('status', 'approved').order('created_at', { ascending: false })
    setUserOrders({ user: userName, orders: data || [] })
    setUserOrdersLoading(false)
  }

  const approveOrder = async (order) => {
    if (!confirm(`Approve payment for "${order.item_name}"?`)) return
    await supabase.from('library').update({ status: 'approved' }).eq('id', order.id)
    await supabase.from('vault_notifications').insert([{
      user_id: order.user_id, title: 'Payment Approved',
      message: `Pembayaran untuk ${order.item_name} telah diverifikasi. Game tersedia di vault Anda.`
    }])
    fetchPendingOrders()
  }

  const rejectOrder = async (order) => {
    if (!confirm(`Reject payment for "${order.item_name}"?`)) return
    await supabase.from('library').update({ status: 'rejected' }).eq('id', order.id)
    await supabase.from('vault_notifications').insert([{
      user_id: order.user_id, title: 'Payment Rejected',
      message: `Pembayaran untuk ${order.item_name} ditolak. Silakan hubungi admin.`
    }])
    fetchPendingOrders()
  }

  const updateRequestStatus = async (id, status) => {
    const { error } = await supabase.from('game_requests').update({ status }).eq('id', id)
    if (error) alert('Error: ' + error.message)
    else fetchRequests()
  }



  const prepareEdit = (g) => {
    setEditId(g.id)
    setForm({
      title: g.title || '',
      genre: g.genre || 'Action',
      price: g.price || 0,
      discount_price: g.discount_price || 0,
      thumbnail: g.thumbnail || '',
      description: g.description || '',
      manual_guide: g.manual_guide || '',
      is_trending: g.is_trending || false,
      connectivity_type: g.connectivity_type || 'Offline',
      release_type: g.release_type || 'instant',
      steam_appid: g.steam_appid || '',
      voratools_link: g.voratools_link || '',
      min_os: g.specifications?.minimum?.os || '',
      min_cpu: g.specifications?.minimum?.cpu || '',
      min_ram: g.specifications?.minimum?.ram || '',
      min_gpu: g.specifications?.minimum?.gpu || '',
      rec_os: g.specifications?.recommended?.os || '',
      rec_cpu: g.specifications?.recommended?.cpu || '',
      rec_ram: g.specifications?.recommended?.ram || '',
      rec_gpu: g.specifications?.recommended?.gpu || '',
      pixeldrain_1: g.download_links?.[0]?.url || '',
      pixeldrain_2: g.download_links?.[1]?.url || '',
      pixeldrain_3: g.download_links?.[2]?.url || '',
      pixeldrain_4: g.download_links?.[3]?.url || '',
    })
    setActiveTab('upload')
  }

  const newGame = () => {
    setEditId('')
    setForm({
      title: '', genre: 'Action', price: 0, discount_price: 0,
      thumbnail: '', description: '', manual_guide: '',
      is_trending: false, connectivity_type: 'Offline',
      release_type: 'instant', steam_appid: '', voratools_link: '',
      min_os: '', min_cpu: '', min_ram: '', min_gpu: '',
      rec_os: '', rec_cpu: '', rec_ram: '', rec_gpu: '',
    })
    setActiveTab('upload')
  }

  const saveGame = async () => {
    if (!form.title) return alert('Title is required')
    const specs = {
      minimum: { os: form.min_os, cpu: form.min_cpu, ram: form.min_ram, gpu: form.min_gpu },
      recommended: { os: form.rec_os, cpu: form.rec_cpu, ram: form.rec_ram, gpu: form.rec_gpu },
    }
    const download_links = [
      { label: 'Game File', url: form.pixeldrain_1, icon: 'box' },
      { label: 'Fix / Update', url: form.pixeldrain_2, icon: 'fix' },
      { label: 'Tutorial / Guide', url: form.pixeldrain_3, icon: 'guide' },
      { label: 'Extra File', url: form.pixeldrain_4, icon: 'box' }
    ].filter(l => l.url.trim() !== '')

    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: Number(form.discount_price),
      specifications: specs,
      download_links: download_links
    }
    delete payload.min_os; delete payload.min_cpu; delete payload.min_ram; delete payload.min_gpu
    delete payload.rec_os; delete payload.rec_cpu; delete payload.rec_ram; delete payload.rec_gpu
    delete payload.pixeldrain_1; delete payload.pixeldrain_2; delete payload.pixeldrain_3; delete payload.pixeldrain_4

    if (editId) {
      await supabase.from('games').update(payload).eq('id', editId)
      alert('Game updated!')
    } else {
      await supabase.from('games').insert([payload])
      alert('Game created!')
    }
    fetchGames()
    setActiveTab('dashboard')
  }

  const deleteGame = async (id) => {
    if (!confirm('Hapus game ini?')) return
    await supabase.from('games').delete().eq('id', id)
    fetchGames()
  }

  const handleZipUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.zip')) return alert('Hanya file .zip yang diizinkan')
    
    setUploadingZip(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `voratools/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('game-assets').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('game-assets').getPublicUrl(filePath)
      setForm({ ...form, voratools_link: data.publicUrl })
      alert('ZIP berhasil diupload ke Supabase!')
    } catch (err) {
      alert('Gagal upload ZIP: ' + err.message + '\n\nPastikan bucket "game-assets" sudah dibuat dan diset Public di Supabase!')
    } finally {
      setUploadingZip(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-red-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="mb-10">
          <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">Admin Terminal</span>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mt-4 text-gradient-fire">Master Control</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          {[
            { id: 'dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Inventory' },
            { id: 'upload', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', label: 'Upload' },
            { id: 'orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Orders', count: pendingOrders.length },
            { id: 'users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Users' },
            { id: 'requests', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Requests', count: requests.length },
            { id: 'chat', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', label: 'Support Chat' },
            { id: 'broadcast', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Broadcast' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase active-scale transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-xl shadow-purple-600/20 text-white'
                  : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}>
              {tab.id === 'upload' ? (editId ? 'Edit Game' : 'Upload') : tab.label}
              {(tab.id === 'orders' && pendingOrders.length > 0) && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[7px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <div>
                <div className="flex justify-between items-center mb-8">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{games.length} Games</p>
              <button onClick={newGame} className="bg-gradient-to-r from-purple-600 to-purple-500 px-8 py-4 rounded-[22px] text-[10px] font-black uppercase active-scale shadow-xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300">+ New Game</button>
            </div>
            <div className="mb-6">
              <input type="text" placeholder="Cari Game..." value={searchGames} onChange={e => setSearchGames(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {games.filter(g => g.title.toLowerCase().includes(searchGames.toLowerCase())).map(g => (
                <div key={g.id} className="glass-card p-6 rounded-[30px] flex items-center justify-between hover:border-purple-500/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <img src={g.thumbnail} className="w-16 h-16 rounded-2xl object-cover border border-white/10" alt={g.title} />
                    <div>
                      <h3 className="font-black uppercase text-sm">{g.title}</h3>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">{g.genre} · {formatRupiah(g.discount_price || g.price)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => prepareEdit(g)} className="px-5 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[9px] font-black uppercase active-scale hover:bg-white/10 transition-all">Edit</button>
                    <button onClick={() => deleteGame(g.id)} className="px-5 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase active-scale hover:bg-red-500/20 transition-all">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="glass-card-premium p-8 md:p-12 rounded-[45px] max-w-3xl mx-auto">
            <h2 className="text-2xl font-black uppercase italic mb-8">{editId ? `Update: ${form.title}` : 'New Game Upload'}</h2>
            <div className="space-y-12">
              {/* Basic Information */}
              <div>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  Basic Information
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Steam App ID</label>
                    <input type="text" placeholder="e.g. 730" value={form.steam_appid} onChange={e => setForm({ ...form, steam_appid: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Genre</label>
                    <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                      {['Action', 'RPG', 'Horror', 'Adventure', 'Simulation'].map(g => <option key={g} className="bg-[#0a0a0a]">{g}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Connectivity</label>
                      <select value={form.connectivity_type} onChange={e => setForm({ ...form, connectivity_type: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                        <option className="bg-[#0a0a0a]">Online</option>
                        <option className="bg-[#0a0a0a]">Offline</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Release</label>
                      <select value={form.release_type} onChange={e => setForm({ ...form, release_type: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                        <option className="bg-[#0a0a0a]">instant</option>
                        <option className="bg-[#0a0a0a]">scheduled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Promotion */}
              <div className="pt-6 border-t border-white/[0.05]">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Pricing & Promotion
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Price (Rp)</label>
                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Discount Price (Rp)</label>
                    <input type="number" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-[18px] bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all w-max">
                      <input type="checkbox" checked={form.is_trending} onChange={e => setForm({ ...form, is_trending: e.target.checked })}
                        className="accent-red-500 w-4 h-4" />
                      <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Mark as Trending</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Media & Content */}
              <div className="pt-6 border-t border-white/[0.05]">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Media & Content
                </p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Thumbnail URL</label>
                    <input type="url" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="4"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Manual Guide</label>
                    <textarea value={form.manual_guide} onChange={e => setForm({ ...form, manual_guide: e.target.value })} rows="3"
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] px-5 py-4 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
                  </div>
                </div>
              </div>

              {/* Downloads & Integration */}
              <div className="pt-6 border-t border-white/[0.05]">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Downloads & Integration
                </p>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-purple-400 tracking-widest flex justify-between">
                      <span>VoraTools License File (.ZIP)</span>
                      {uploadingZip && <span className="text-yellow-400 animate-pulse">Uploading...</span>}
                    </label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input type="url" placeholder="Direct link to ZIP..." value={form.voratools_link} onChange={e => setForm({ ...form, voratools_link: e.target.value })}
                        className="flex-1 bg-white/[0.03] border border-purple-500/30 rounded-[18px] px-5 py-4 text-sm outline-none text-white focus:border-purple-500 transition-all" />
                      <label className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 text-purple-400 rounded-[18px] px-8 py-4 cursor-pointer transition-all flex items-center justify-center shrink-0">
                        <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} disabled={uploadingZip} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Upload ZIP</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Pixeldrain Download Links (Game Files)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📦</span>
                        <input type="url" placeholder="Game File URL" value={form.pixeldrain_1} onChange={e => setForm({ ...form, pixeldrain_1: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] pl-12 pr-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🛠️</span>
                        <input type="url" placeholder="Fix / Update URL" value={form.pixeldrain_2} onChange={e => setForm({ ...form, pixeldrain_2: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] pl-12 pr-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📖</span>
                        <input type="url" placeholder="Tutorial / Guide URL" value={form.pixeldrain_3} onChange={e => setForm({ ...form, pixeldrain_3: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] pl-12 pr-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📦</span>
                        <input type="url" placeholder="Extra File URL" value={form.pixeldrain_4} onChange={e => setForm({ ...form, pixeldrain_4: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[18px] pl-12 pr-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/[0.05]">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6">System Specifications</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Minimum</p>
                  {['os', 'cpu', 'ram', 'gpu'].map(s => (
                    <input key={s} type="text" placeholder={s.toUpperCase()} value={form[`min_${s}`]} onChange={e => setForm({ ...form, [`min_${s}`]: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[16px] px-5 py-3 text-xs outline-none text-white focus:border-purple-500/40 transition-all" />
                  ))}
                </div>
                <div className="space-y-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Recommended</p>
                  {['os', 'cpu', 'ram', 'gpu'].map(s => (
                    <input key={s} type="text" placeholder={s.toUpperCase()} value={form[`rec_${s}`]} onChange={e => setForm({ ...form, [`rec_${s}`]: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[16px] px-5 py-3 text-xs outline-none text-white focus:border-purple-500/40 transition-all" />
                  ))}
                </div>
              </div>
            </div>

            <button onClick={saveGame} className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-5 rounded-[22px] font-black text-[11px] uppercase tracking-widest mt-10 active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-xl">
              {editId ? 'Apply Updates' : 'Upload Game'}
            </button>
          </div>
        )}



        {activeTab === 'requests' && (
          <div className="glass-card-premium p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Game Requests</h2>
              <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                {requests.length} requests
              </span>
            </div>
            <div className="mb-6">
              <input type="text" placeholder="Cari Request (Judul Game / Email)..." value={searchRequests} onChange={e => setSearchRequests(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
            </div>
            {requests.length === 0 ? (
              <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No game requests yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-2">User Email</th>
                      <th className="pb-4 px-2">Game Title</th>
                      <th className="pb-4 px-2">Notes & Platform</th>
                      <th className="pb-4 px-2">Date</th>
                      <th className="pb-4 px-2 text-center">Status</th>
                      <th className="pb-4 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.filter(r => (r.game_title||'').toLowerCase().includes(searchRequests.toLowerCase()) || (r.user_email||'').toLowerCase().includes(searchRequests.toLowerCase())).map(r => (
                      <tr key={r.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter max-w-[120px] truncate">{r.user_email || '-'}</td>
                        <td className="py-5 px-2 text-[10px] font-black uppercase">{r.game_title || '-'}</td>
                        <td className="py-5 px-2 text-[9px] text-gray-400 max-w-[300px] truncate">
                          <span className="text-purple-400 font-bold mr-2">[{r.platform}]</span>
                          {r.notes || '-'}
                        </td>
                        <td className="py-5 px-2 text-[9px] text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="py-5 px-2 text-center">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                            r.status === 'fullverified' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                            r.status === 'proses' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                            r.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                            'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                          }`}>
                            {r.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-5 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateRequestStatus(r.id, 'proses')} title="Proses" className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => updateRequestStatus(r.id, 'fullverified')} title="Full Verified" className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => updateRequestStatus(r.id, 'rejected')} title="Reject" className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="glass-card-premium p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Support Chat</h2>
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                {chatUsers.length} conversations
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white/[0.02] border border-white/[0.06] rounded-[30px] p-4 max-h-[550px] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Inbox</h3>
                  {chatUsers.filter(u => u.unread > 0).length > 0 && (
                    <span className="text-[8px] text-purple-400 font-black">{chatUsers.filter(u => u.unread > 0).length} new</span>
                  )}
                </div>
                {chatUsers.length === 0 ? (
                  <p className="text-gray-600 text-[10px] font-black uppercase italic text-center py-10">No conversations</p>
                ) : (
                  <div className="space-y-1">
                    {chatUsers.map(u => (
                      <button key={u.user_id} onClick={() => loadChatMessages(u.user_id)}
                        className={`w-full text-left p-3.5 rounded-[18px] transition-all duration-300 ${
                          selectedChat === u.user_id
                            ? 'bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/25'
                            : 'hover:bg-white/[0.04] border border-transparent'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase shrink-0 border border-purple-400/20">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase truncate">{u.name || u.user_id.slice(0, 8)}</span>
                              <span className="text-[7px] text-gray-600 shrink-0">{u.lastTime ? new Date(u.lastTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-[8px] text-gray-600 truncate">{u.lastMessage}</span>
                              {u.unread > 0 && (
                                <span className="shrink-0 bg-purple-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full">{u.unread}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-[30px] flex flex-col h-[550px]">
                {!selectedChat ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-[10px] font-black uppercase italic">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      Pilih user untuk memulai chat
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-5 border-b border-white/[0.04] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase border border-purple-400/20">
                        {chatUsers.find(u => u.user_id === selectedChat)?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase">{chatUsers.find(u => u.user_id === selectedChat)?.name || selectedChat.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div id="chat-messages-container" className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-3.5 text-[10px] font-bold leading-relaxed ${
                            msg.is_admin_reply
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500 rounded-[18px] rounded-bl-[4px]'
                              : 'bg-white/[0.06] rounded-[18px] rounded-br-[4px]'
                          }`}>
                            <div className="text-[7px] opacity-50 uppercase tracking-widest mb-1">
                              {msg.is_admin_reply ? 'Admin' : msg.sender_name}
                            </div>
                            {msg.message}
                            <div className="text-[7px] mt-1.5 opacity-40">
                              {new Date(msg.created_at).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-5 border-t border-white/[0.04] flex gap-3">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatReply()}
                        placeholder="Ketik balasan..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-[11px] outline-none text-white font-bold placeholder:text-gray-700 focus:border-purple-500/30 transition-all" />
                      <button onClick={sendChatReply}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                        Kirim
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="glass-card-premium p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Pending Orders</h2>
              <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                {pendingOrders.length} menunggu
              </span>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No pending orders</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-2">ID</th>
                      <th className="pb-4 px-2">Game</th>
                      <th className="pb-4 px-2">User</th>
                      <th className="pb-4 px-2 text-right">Amount</th>
                      <th className="pb-4 px-2 text-center">Proof</th>
                      <th className="pb-4 px-2">Date</th>
                      <th className="pb-4 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                          #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                        </td>
                        <td className="py-5 px-2">
                          <p className="text-[10px] font-black uppercase truncate max-w-[120px]">{order.item_name}</p>
                        </td>
                        <td className="py-5 px-2">
                          <p className="text-[9px] font-bold">{order.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-[7px] text-gray-500">{order.profiles?.email}</p>
                        </td>
                        <td className="py-5 px-2 text-right text-[10px] font-black text-purple-400 whitespace-nowrap">
                          {order.games ? 'Rp ' + Number(order.games.discount_price || order.games.price || 0).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-5 px-2 text-center">
                          {order.payment_proof ? (
                            <button onClick={() => setProofPreview(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Lihat
                            </button>
                          ) : (
                            <span className="text-[8px] text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-5 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-5 px-2">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => approveOrder(order)}
                              className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-green-500/20 transition-all">
                              Approve
                            </button>
                            <button onClick={() => rejectOrder(order)}
                              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-red-500/20 transition-all">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card-premium p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">All Users</h2>
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                {users.length} total
              </span>
            </div>
            <div className="mb-6">
              <input type="text" placeholder="Cari User (Nama / Email)..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                      <th className="pb-4 px-2">Avatar</th>
                      <th className="pb-4 px-2">Name</th>
                      <th className="pb-4 px-2">Email</th>
                      <th className="pb-4 px-2">Username</th>
                      <th className="pb-4 px-2">Role</th>
                      <th className="pb-4 px-2 text-center">Games</th>
                      <th className="pb-4 px-2">Payment</th>
                      <th className="pb-4 px-2">Referral</th>
                      <th className="pb-4 px-2">Joined</th>
                    </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="9" className="py-10 text-center opacity-20 text-[10px] font-black uppercase italic tracking-widest">No users found</td></tr>
                  ) : (
                    users.filter(u => (u.full_name||'').toLowerCase().includes(searchUsers.toLowerCase()) || (u.email||'').toLowerCase().includes(searchUsers.toLowerCase())).map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                        <td className="py-4 px-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 overflow-hidden border border-white/10">
                            <img
                              src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name || u.email}&background=6D28D9&color=fff`}
                              className="w-full h-full object-cover"
                              alt="avatar"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-[10px] font-black uppercase leading-tight">{u.full_name || '—'}</p>
                        </td>
                        <td className="py-4 px-2 text-[9px] text-gray-400">{u.email || '—'}</td>
                        <td className="py-4 px-2 text-[9px] font-bold text-gray-500">{u.username || '—'}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2.5 py-1 rounded text-[7px] font-black border uppercase ${u.role === 'admin' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-white/[0.03] border-white/[0.08]'}`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-purple-400">{u.game_count}</span>
                            {u.game_names.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 max-w-[160px]">
                                {u.game_names.slice(0, 3).map((name, i) => (
                                  <span key={i} className="text-[6px] bg-white/[0.04] px-1.5 py-0.5 rounded font-bold uppercase leading-tight truncate max-w-full">
                                    {name}
                                  </span>
                                ))}
                                {u.game_names.length > 3 && (
                                  <span className="text-[6px] text-gray-600 font-bold">+{u.game_names.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <button onClick={() => viewUserOrders(u.id, u.full_name || u.email)}
                            className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale uppercase tracking-wider">
                            Lihat
                          </button>
                        </td>
                        <td className="py-4 px-2 text-[8px] text-gray-600 font-bold uppercase">{u.referral_source || '—'}</td>
                        <td className="py-4 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Broadcast Message</p>
            </div>
            <div className="glass-card-premium p-8 rounded-[35px] max-w-xl">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Title</label>
                  <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700"
                    placeholder="e.g. Maintenance" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Message</label>
                  <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-6 py-4 outline-none focus:border-purple-500/40 focus:bg-white/[0.05] transition-all text-sm font-medium text-white placeholder:text-gray-700 resize-none"
                    placeholder="Type your announcement..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Type</label>
                  <div className="flex gap-3">
                    {['info', 'maintenance', 'new_game'].map(t => (
                      <button key={t} onClick={() => setBroadcastType(t)}
                        className={`px-6 py-3 rounded-[16px] text-[9px] font-black uppercase tracking-wider transition-all active-scale ${
                          broadcastType === t
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/20'
                            : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white'
                        }`}>
                        {t === 'info' ? 'Info' : t === 'maintenance' ? 'Maintenance' : 'New Game'}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={sendBroadcast} disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-[22px] hover:shadow-xl hover:shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50 mt-4">
                  Kirim Broadcast
                </button>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {proofPreview && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => setProofPreview(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="glass-card-premium p-6 rounded-[35px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight text-gradient">Detail Pembayaran</h3>
                <button onClick={() => setProofPreview(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all active-scale">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-white/[0.03] rounded-3xl p-5 space-y-3 mb-5 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Game</span>
                  <span className="text-[11px] font-black uppercase">{proofPreview.games?.title || proofPreview.item_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Jumlah</span>
                  <span className="text-[11px] font-black">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">User</span>
                  <span className="text-[10px] font-bold text-right">{proofPreview.profiles?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Tanggal</span>
                  <span className="text-[9px] font-bold text-gray-400">{new Date(proofPreview.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <img src={proofPreview.payment_proof || proofPreview.proof_url} alt="Payment Proof" className="w-full rounded-2xl border border-white/[0.06]" />

              <a href={proofPreview.payment_proof || proofPreview.proof_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 mt-4 w-full px-5 py-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[9px] font-black uppercase tracking-wider hover:bg-white/10 transition-all active-scale">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Gambar
              </a>
            </div>
          </div>
        </div>
      )}

      {userOrders && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => setUserOrders(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-2xl w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="glass-card-premium p-6 rounded-[35px] max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-tight text-gradient">Orders: {userOrders.user}</h3>
                <button onClick={() => setUserOrders(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all active-scale">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {userOrdersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userOrders.orders.length === 0 ? (
                <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No orders found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                        <th className="pb-3 px-2">Game</th>
                        <th className="pb-3 px-2 text-right">Harga</th>
                        <th className="pb-3 px-2 text-center">Status</th>
                        <th className="pb-3 px-2">Tanggal</th>
                        <th className="pb-3 px-2 text-center">Bukti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.orders.map(o => {
                        const proof = o.payment_proof || o.proof_url
                        return (
                        <tr key={o.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                          <td className="py-4 px-2">
                            <p className="text-[10px] font-black uppercase leading-tight">{o.games?.title || 'Unknown'}</p>
                          </td>
                          <td className="py-4 px-2 text-right text-[10px] font-black text-purple-400 whitespace-nowrap">—</td>
                          <td className="py-4 px-2 text-center">
                            <span className={`px-2 py-1 rounded text-[7px] font-black border uppercase ${
                              o.status === 'approved' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                              o.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                              'text-red-500 bg-red-500/10 border-red-500/20'
                            }`}>{o.status === 'approved' ? 'success' : o.status}</span>
                          </td>
                          <td className="py-4 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                            {new Date(o.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-4 px-2 text-center">
                            {proof ? (
                              <button onClick={() => { const name = userOrders.user; setUserOrders(null); setProofPreview({ ...o, profiles: { full_name: name } }) }}
                                className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale uppercase tracking-wider">
                                Lihat
                              </button>
                            ) : (
                              <span className="text-[8px] text-gray-600">-</span>
                            )}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
