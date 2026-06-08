import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function RealtimeNotifications() {
  const { profile } = useAuth()
  const toastTimer = useRef(null)

  const toast = (title, message) => {
    const container = document.getElementById('notification-toast-container') || (() => {
      const el = document.createElement('div')
      el.id = 'notification-toast-container'
      el.className = 'fixed top-20 right-6 z-[9999] flex flex-col gap-3 max-w-[360px]'
      document.body.appendChild(el)
      return el
    })()
    const t = document.createElement('div')
    t.className = 'bg-gradient-to-r from-purple-700/90 to-purple-600/90 backdrop-blur-xl border border-purple-400/20 rounded-2xl px-5 py-4 shadow-2xl text-white animate-fade-in'
    t.innerHTML = `<p class="text-[10px] font-black uppercase tracking-widest text-purple-300">${title}</p><p class="text-xs font-bold mt-1">${message}</p>`
    container.appendChild(t)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => { container.innerHTML = '' }, 4000)
  }

  const push = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/vite.svg' })
    }
  }

  useEffect(() => {
    if (!profile?.id) return


    const channels = []

    channels.push(
      supabase.channel('realtime_notifications_' + profile.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vault_notifications' }, (payload) => {
          const n = payload.new
          if (n.user_id !== profile.id) return
          push(n.title, n.message)
          toast(n.title, n.message)
        })
        .subscribe()
    )

    channels.push(
      supabase.channel('realtime_library_status_' + profile.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'library', filter: 'user_id=eq.' + profile.id }, (payload) => {
          const { old: oldRow, new: newRow } = payload
          if (oldRow.status !== 'pending' || (newRow.status !== 'approved' && newRow.status !== 'rejected')) return
          const title = newRow.status === 'approved' ? 'Pembelian Disetujui' : 'Pembelian Ditolak'
          const msg = newRow.status === 'approved'
            ? 'Game kamu sudah aktif! Cek koleksi kamu sekarang.'
            : 'Pembelian kamu ditolak. Cek alasan di halaman pesanan.'
          push(title, msg)
          toast(title, msg)
        })
        .subscribe()
    )

    if (profile.role === 'admin') {
      channels.push(
        supabase.channel('realtime_library_new_admin_' + profile.id)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'library' }, (payload) => {
            const row = payload.new
            if (row.status !== 'pending') return
            push('Pembelian Baru!', 'Ada pembelian game baru menunggu verifikasi.')
            toast('Pembelian Baru!', 'Ada pembelian game baru menunggu verifikasi.')
          })
          .subscribe()
      )
    }

    channels.push(
      supabase.channel('realtime_games')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games' }, (payload) => {
          const g = payload.new
          push('Game Baru!', g.title + ' sudah tersedia!')
          toast('Game Baru!', g.title + ' sudah tersedia!')
        })
        .subscribe()
    )

    channels.push(
      supabase.channel('announcements', { config: { broadcast: { self: true } } })
        .on('broadcast', { event: 'announcement' }, (payload) => {
          const p = payload.payload
          push(p.title, p.message)
          toast(p.title, p.message)
        })
        .subscribe()
    )

    return () => {
      channels.forEach(c => supabase.removeChannel(c))
    }
  }, [profile?.id, profile?.role])

  return null
}
