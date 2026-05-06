import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import Carga from './pages/Carga'
import Espera from './pages/Espera'
import Atencion from './pages/Atencion'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-hsj-bg">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/carga" replace />} />
              <Route path="/carga" element={<Carga />} />
              <Route path="/espera" element={<Espera />} />
              <Route path="/atencion" element={<Atencion />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
