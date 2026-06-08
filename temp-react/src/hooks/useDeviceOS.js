import { useState, useEffect } from 'react'

export function useDeviceOS() {
  const [os, setOs] = useState('desktop')

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase() || window.navigator.vendor.toLowerCase()

    if (/ipad|iphone|ipod/.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
      setOs('ios')
    } else if (/android/.test(userAgent)) {
      setOs('android')
    } else {
      setOs('desktop')
    }
  }, [])

  return os
}
