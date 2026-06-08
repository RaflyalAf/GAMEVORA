import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SurveyModal() {
  const { user, profile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || !profile) { setChecking(false); return }

    const alreadyAnswered = profile?.referral_source && profile.referral_source.trim() !== ''
    const sessionDone = sessionStorage.getItem('gv_survey_session') === 'done'

    if (!alreadyAnswered && !sessionDone) {
      setVisible(true)
    }
    setChecking(false)
  }, [user, profile])

  const handleSubmit = async (source) => {
    await supabase.from('profiles').update({ referral_source: source }).eq('id', user.id)
    sessionStorage.setItem('gv_survey_session', 'done')
    setVisible(false)
  }

  const handleSkip = () => {
    sessionStorage.setItem('gv_survey_session', 'done')
    setVisible(false)
  }

  if (checking || !visible || !user) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={handleSkip} />
      <div className="relative glass-card-premium p-10 rounded-[45px] max-w-md w-full border-purple-500/20 text-center animate-fade-in">
        <div className="absolute top-0 right-0 w-28 h-28 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />
        <button onClick={handleSkip} className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">
          Skip
        </button>
        <div className="w-20 h-20 bg-purple-600/20 rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-purple-500/30">
          <span className="text-3xl">Satellite</span>
        </div>
        <h2 className="text-2xl font-black italic uppercase mb-4 tracking-tighter text-gradient">Signal Detected</h2>
        <p className="text-[11px] text-gray-400 uppercase tracking-widest leading-relaxed mb-10 px-4 font-medium">
          Selamat datang Hunter!<br />Tau GameVora dari siapa?
        </p>
        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => handleSubmit('Teman')} className="w-full bg-gradient-to-r from-white to-gray-100 text-black py-5 rounded-2xl font-black text-xs uppercase active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-xl">
            Dari Teman
          </button>
          <button onClick={() => handleSubmit('Instagram')} className="w-full bg-white/[0.03] border border-white/[0.08] text-white py-5 rounded-2xl font-black text-xs uppercase active-scale hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
            Instagram
          </button>
          <button onClick={() => handleSubmit('TikTok')} className="w-full bg-white/[0.03] border border-white/[0.08] text-white py-5 rounded-2xl font-black text-xs uppercase active-scale hover:bg-blue-600/20 hover:border-blue-500/30 transition-all">
            TikTok
          </button>
        </div>
      </div>
    </div>
  )
}
