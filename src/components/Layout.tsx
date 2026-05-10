import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import ParticlesBackground from './ParticlesBackground'

export default function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-cyber-900 relative selection:bg-cyan-500/30 selection:text-white">
      <div className="scanline" />
      <ParticlesBackground />
      <Sidebar />
      <MobileHeader />
      <main className="lg:ml-[260px] min-h-screen relative z-10">
        <div className="p-4 pt-20 pb-28 lg:p-10 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
