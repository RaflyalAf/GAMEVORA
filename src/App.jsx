import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import Home from './pages/Home'
import Store from './pages/Store'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'
import Dashboard from './pages/Dashboard'
import Detail from './pages/Detail'
import ProfileOverview from './pages/ProfileOverview'
import ProfileCollection from './pages/ProfileCollection'
import ProfileWishlist from './pages/ProfileWishlist'
import ProfileOrders from './pages/ProfileOrders'
import ProfileSettings from './pages/ProfileSettings'
import ProfilePromptModal from './components/ProfilePromptModal'
import RealtimeNotifications from './components/RealtimeNotifications'
import FAQ from './pages/FAQ'
import Request from './pages/Request'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProfilePromptModal />
          <RealtimeNotifications />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/profile" element={<ProfileOverview />} />
            <Route path="/profile/collection" element={<ProfileCollection />} />
            <Route path="/profile/wishlist" element={<ProfileWishlist />} />
            <Route path="/profile/orders" element={<ProfileOrders />} />
            <Route path="/profile/settings" element={<ProfileSettings />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/request" element={<Request />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
