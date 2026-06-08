import { useState } from 'react'

export default function SocialFloat() {
  const [open, setOpen] = useState(false)

  const socialLinks = [
    { href: 'https://discord.gg/wQg7xuQsSd', bg: 'bg-[#5865F2]', icon: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.077 0 00.084-.028c.462-.63.862-1.297 1.197-1.99a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.23 10.23 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.078.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' },
    { href: 'https://www.instagram.com/gamevora.official/', bg: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>' },
    { href: 'https://www.tiktok.com/@gamevora.official', bg: 'bg-black', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.59-5.71-.29-2.63.85-5.21 2.86-6.84 1.28-1.01 2.85-1.54 4.5-1.53.05 1.87.03 3.74.03 5.61-1.34-.23-2.85.12-3.67 1.25-.59.82-.69 1.89-.35 2.83.31.91 1.08 1.63 1.99 1.9 1.15.38 2.48.15 3.39-.68.66-.62 1.01-1.51 1.01-2.42V.02z' },
  ]

  return (
    <div className="float-social-container fixed bottom-28 right-6 z-[4000] flex flex-col items-end gap-3">
      <div className={`flex flex-col gap-3 mb-2 transition-all duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {socialLinks.map((link, i) => (
          <a
            key={i}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 ${link.bg} ${open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-0'}`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            {i === 0 ? (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d={link.icon} /></svg>
            ) : i === 1 ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: link.icon }} />
            ) : (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d={link.icon} /></svg>
            )}
          </a>
        ))}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/10 active-scale"
      >
        <svg
          className="w-6 h-6 text-white transition-transform duration-300"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  )
}
