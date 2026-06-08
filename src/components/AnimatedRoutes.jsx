import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Home from '../pages/Home'
import Store from '../pages/Store'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import UpdatePassword from '../pages/UpdatePassword'
import Dashboard from '../pages/Dashboard'
import Detail from '../pages/Detail'
import ProfileOverview from '../pages/ProfileOverview'
import ProfileCollection from '../pages/ProfileCollection'
import ProfileWishlist from '../pages/ProfileWishlist'
import ProfileOrders from '../pages/ProfileOrders'
import ProfileSettings from '../pages/ProfileSettings'
import FAQ from '../pages/FAQ'
import Request from '../pages/Request'
import Admin from '../pages/Admin'
import Giveaways from '../pages/Giveaways'

export default function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Routes location={location}>
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
          <Route path="/giveaways" element={<Giveaways />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
