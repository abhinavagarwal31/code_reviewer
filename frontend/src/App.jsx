import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import PRDetail from './pages/PRDetail'

function Navbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-700 px-8 py-4 flex items-center gap-3 sticky top-0 z-10">
      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
      <Link to="/" className="text-white font-bold text-lg tracking-tight hover:text-slate-200">
        CodeReview AI
      </Link>
      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">Dashboard</span>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reviews/:id" element={<PRDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
