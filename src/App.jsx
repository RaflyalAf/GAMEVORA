import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import AnimatedRoutes from './components/AnimatedRoutes'

import ProfilePromptModal from './components/ProfilePromptModal'
import RealtimeNotifications from './components/RealtimeNotifications'

import { useEffect } from 'react'
import { useDeviceOS } from './hooks/useDeviceOS'

function OSProvider({ children }) {
  const os = useDeviceOS()
  useEffect(() => {
    document.body.className = `os-${os}`
  }, [os])
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <OSProvider>
      <AuthProvider>
        <CartProvider>
          <ProfilePromptModal />
          <RealtimeNotifications />
          <AnimatedRoutes />
        </CartProvider>
      </AuthProvider>
      </OSProvider>
    </BrowserRouter>
  )
}
