import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function InboxModal({ open, onClose }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  const fetchNotifs = () => {
    if (!user) return
    supabase
      .from('vault_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotifications(data || [])
        supabase.from('vault_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      })
  }

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('inbox_' + user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vault_notifications', filter: 'user_id=eq.' + user.id }, () => {
        if (openRef.current) fetchNotifs()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    fetchNotifs()
    setLoading(false)
  }, [open, user])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      <div className="relative glass-card-premium p-8 rounded-[45px] max-w-lg w-full max-h-[75vh] flex flex-col shadow-2xl">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-[50px] pointer-events-none" />
        <h3 className="text-xl font-black uppercase italic mb-6 text-gradient">Vault Transmissions</h3>
        <div className="flex-grow overflow-y-auto space-y-3 no-scrollbar min-h-[300px]">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="opacity-30 text-[10px] uppercase font-black italic animate-pulse">Syncing Vault...</p>
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center py-16 opacity-30 text-[10px] font-black uppercase italic">Inbox Empty</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-5 rounded-[25px] bg-white/[0.03] border transition-all mb-3 text-left ${
                  n.is_read ? 'border-white/[0.04] opacity-50' : 'border-purple-500/30 bg-purple-500/[0.03]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[11px] font-black uppercase tracking-tight">{n.title}</h4>
                  {!n.is_read && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/30" />}
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{n.message}</p>
                <span className="text-[7px] text-gray-600 mt-3 block font-bold uppercase">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase active-scale border border-white/10 hover:bg-white/10 transition-all">
          Close Inbox
        </button>
      </div>
    </div>
  )
}
