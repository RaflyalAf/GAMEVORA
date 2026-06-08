import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HeroSlider({ games }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()
  const trending = games?.filter(g => g.is_trending).slice(0, 4) || []

  useEffect(() => {
    if (trending.length < 2) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % trending.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [trending.length])

  if (trending.length === 0) return null

  return (
    <section className="relative hero-container shadow-2xl animate-fade-in">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="h-full w-full bg-black/20">
        {trending.map((game, index) => (
          <div
            key={game.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={game.thumbnail}
              className="w-full h-full object-cover"
              alt={game.title}
            />
            <div className="absolute inset-0 hero-overlay flex flex-col justify-end px-8 md:px-20 pb-20">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="inline-block text-purple-400 font-black uppercase tracking-[0.5em] text-[10px] mb-4 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 backdrop-blur-xl">
                  Trending Now
                </span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 leading-none animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {game.title}
              </h1>
              <p className="max-w-md text-gray-400 text-sm font-medium leading-relaxed mb-8 line-clamp-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {game.description || 'Secure encrypted vault access.'}
              </p>
              <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={() => navigate(`/detail/${game.id}`)}
                  className="w-fit bg-gradient-to-r from-purple-600 to-purple-500 px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest active-scale shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:from-purple-500 hover:to-purple-400 transition-all duration-300"
                >
                  View Vault
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trending.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {trending.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
