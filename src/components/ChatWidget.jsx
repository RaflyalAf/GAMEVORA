import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open || !user) return
    loadMessages()
  }, [open, user])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('chat_widget_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: 'user_id=eq.' + user.id }, () => {
        if (openRef.current) loadMessages()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function loadMessages() {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!input.trim() || !user) return
    await supabase.from('chats').insert([{
      user_id: user.id,
      sender_name: user.email.split('@')[0],
      message: input.trim(),
      is_admin_reply: false,
    }])
    setInput('')
    loadMessages()
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-28 left-6 z-[4000] w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full flex items-center justify-center active-scale border border-purple-400/20 shadow-2xl hover:shadow-[0_10px_40px_rgba(168,85,247,0.4)] transition-all duration-300 animate-float"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-[140px] left-6 z-[3500] w-[340px] h-[460px] bg-gradient-to-b from-[#0c0c0e] to-[#08080a] border border-white/[0.06] rounded-[35px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-slide-up">
          <div className="p-5 bg-gradient-to-r from-purple-600 to-purple-500 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/30" />
              <span className="text-[11px] font-black uppercase tracking-widest">Support Sync</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-[9px] font-black uppercase tracking-wider transition-colors">Close</button>
          </div>
          <div ref={containerRef} className="flex-grow p-5 overflow-y-auto space-y-3 no-scrollbar flex flex-col">
            {messages.map((msg, idx) => {
              const isRead = !msg.is_admin_reply && messages.slice(idx + 1).some(m => m.is_admin_reply)
              return (
              <div
                key={msg.id}
                className={`${
                  !msg.is_admin_reply
                    ? 'self-end bg-gradient-to-l from-purple-600 to-purple-500 text-right rounded-[20px] rounded-br-[4px]'
                    : 'self-start bg-white/[0.06] text-left rounded-[20px] rounded-bl-[4px]'
                } p-3.5 max-w-[88%] text-[10px] font-bold leading-relaxed shadow-lg animate-fade-in`}
              >
                {msg.message}
                <div className="flex items-center justify-end gap-1 mt-1.5">
                  {!msg.is_admin_reply && (
                    <span className={`text-[7px] ${isRead ? 'text-red-400' : 'text-purple-300'} opacity-80`}>
                      {isRead ? 'Dibaca' : '✓'}
                    </span>
                  )}
                  <span className={`text-[7px] ${!msg.is_admin_reply ? 'text-purple-300' : 'text-gray-600'} opacity-60`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )})}
          </div>
          <div className="p-4 bg-white/[0.02] border-t border-white/[0.04] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type here..."
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 text-[12px] flex-grow outline-none text-white font-bold uppercase placeholder:text-gray-700 focus:border-purple-500/30 transition-colors"
            />
            <button onClick={sendMessage} className="bg-gradient-to-br from-purple-600 to-purple-500 p-4 rounded-2xl active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
