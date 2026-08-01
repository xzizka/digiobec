import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { SubmissionsPage } from './pages/SubmissionsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/settings" element={<div className="p-4">Settings - Coming Soon</div>} />
      </Route>
      <Route path="*" element={<div className="p-8 text-center">404 - Stránka nenalezena</div>} />
    </Routes>
  )
}

export default App