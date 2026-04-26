import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import Home from './pages/Home'
import Login from './pages/Login'
import Select from './pages/Select'
import Write from './pages/Write'
import Send from './pages/Send'
import Profile from './pages/Profile'
import Read from './pages/Read'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select" element={<Select />} />
        <Route path="/write" element={<Write />} />
        <Route path="/send" element={<Send />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/letter/:token" element={<Read />} />
        <Route path="/read" element={<Read />} />
      </Routes>
    </ToastProvider>
  )
}
