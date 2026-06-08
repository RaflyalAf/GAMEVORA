import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

export default function ProfileSettings() {
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
      }
    })
  }, [user])

  const saveProfile = async () => {
    if (!fullName.trim()) return alert('Full Name cannot be empty!')
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, username, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
    })
    if (error) {
      alert('Sync Error: ' + error.message)
    } else {
      refreshProfile()
      alert('Vault Identity Synchronized!')
    }
    setSaving(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Maksimal ukuran foto adalah 2MB!')
    
    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file)
    
    if (uploadError) {
      alert('Gagal mengupload foto: ' + uploadError.message)
      setUploadingAvatar(false)
      return
    }
    
    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setAvatarUrl(data.publicUrl)
    setUploadingAvatar(false)
  }


  const updatePassword = async () => {
    if (!newPass || newPass !== confirmPass) return alert('Passwords do not match!')
    if (newPass.length < 6) return alert('Password too weak!')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) alert('Error: ' + error.message)
    else {
      alert('Password updated successfully!')
      setNewPass('')
      setConfirmPass('')
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return alert('🚨 Fitur Notifikasi Terkunci oleh Sistem!\n\nJika kamu menggunakan iPhone/iOS, Apple MENGHARUSKAN kamu menekan tombol "Share" (Bagikan) di Safari lalu memilih "Add to Home Screen".\n\nSilakan lakukan itu, lalu buka kembali GAMEVORA dari Layar Utama HP kamu untuk menyalakan notifikasi.')
    }
    
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const VAPID_PUBLIC_KEY = 'BKN9gcHtQK7rhW0Er-NzizKLXomuPfBan-uDzwT-cCVIUeSdnlCyDxDY4P4cx5gjnslkDQvh495bv9ZcuEdtKqA'
        
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          })
        }
        
        const subJSON = subscription.toJSON()
        
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subJSON.endpoint,
          auth_key: subJSON.keys.auth,
          p256dh_key: subJSON.keys.p256dh
        }, { onConflict: 'endpoint' })
        
        if (error) throw error
        
        alert('Notifikasi Lockscreen berhasil diaktifkan! 🎉')
      } else {
        alert('Izin notifikasi ditolak. Jika kamu menggunakan iOS (iPhone), pastikan kamu sudah melakukan "Add to Home Screen" melalui menu Share di Safari, lalu coba lagi dari aplikasi yang muncul di layar utamamu.')
      }
    } catch (e) {
      console.error(e)
      alert('Gagal mengaktifkan notifikasi: ' + e.message)
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-yellow-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
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
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-gradient">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
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
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Avatar Profile</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/[0.03] border border-white/[0.08] p-4 rounded-[20px]">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/30 bg-purple-600/10 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👾</div>
                    )}
                  </div>
                  <div className="flex-1 w-full relative">
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex items-center justify-center w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 hover:bg-white/[0.08] transition-all">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                        {uploadingAvatar ? 'MENGUPLOAD...' : 'PILIH FOTO (MAKS 2MB)'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <input type="url" placeholder="Atau paste URL gambar..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-[15px] px-4 py-3 outline-none focus:border-purple-500/30 transition-all text-xs text-white placeholder:text-gray-700" />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving || uploadingAvatar}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <div className="glass-card-premium p-8 rounded-[40px] space-y-6">
            <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Notifications
            </h3>
            <div className="bg-white/[0.02] border border-blue-500/10 p-5 rounded-2xl">
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-4">
                Terima pemberitahuan real-time untuk update game baru, broadcast admin, dan persetujuan pesanan.
                <br /><br />
                <span className="text-blue-400">Penting untuk iOS/iPhone:</span> Kamu wajib menekan tombol <b>Share</b> di bawah layar Safari dan pilih <b>Add to Home Screen</b> terlebih dahulu.
              </p>
              <button onClick={requestNotificationPermission}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest active-scale hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Nyalakan Notifikasi
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button onClick={signOut}
            className="inline-flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-10 py-5 rounded-[30px] font-black text-[11px] uppercase tracking-widest active-scale hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </main>
    </div>
  )
}
