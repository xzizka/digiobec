import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/submissions" element={<div className="p-4">Submissions - Coming Soon</div>} />
        <Route path="/settings" element={<div className="p-4">Settings - Coming Soon</div>} />
      </Route>
      <Route path="*" element={<div className="p-8 text-center">404 - Stránka nenalezena</div>} />
    </Routes>
  )
}

export default App