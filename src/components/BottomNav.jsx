import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDeviceOS } from '../hooks/useDeviceOS'

export default function BottomNav() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const os = useDeviceOS()

  const links = [
    { to: '/', label: 'Home', icon: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z', fill: true },
    { to: '/store', label: 'Store', icon: 'M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z', fill: false },
    { to: '/faq', label: 'FAQ', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', fill: false },
    { to: '/request', label: 'Request', icon: 'M12 4v16m8-8H4', fill: false },
    { to: '/giveaways', label: 'Giveaway', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', fill: false },
    ...(isAdmin ? [{ to: '/admin', label: 'Master', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', fill: false, isRed: true }] : []),
    { to: '/dashboard', label: 'Vault', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', fill: false },
  ]

  return (
    <div className={`bottom-nav bottom-nav-${os}`}>
      {links.map((link) => {
        const isActive = location.pathname === link.to
        const colorClass = link.isRed
          ? 'text-red-400'
          : isActive
            ? 'text-purple-400'
            : 'text-gray-500'
            
        // OS specific active styles
        const activeClass = isActive 
          ? (os === 'android' ? 'bg-purple-500/20 android-ripple' : 'bg-purple-500/10') 
          : ''
          
        return (
          <Link
            key={link.label}
            to={link.to}
            className={`nav-item-${os} flex flex-col items-center gap-0.5 active-scale relative py-1 px-3 transition-all duration-200 ${activeClass} ${colorClass}`}
          >
            {link.fill ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d={link.icon} />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
            )}
            <span className="text-[7px] font-black uppercase tracking-wider">{link.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
