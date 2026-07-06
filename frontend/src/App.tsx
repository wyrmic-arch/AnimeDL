import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SearchPage from './pages/SearchPage'
import AnimePage from './pages/AnimePage'
import DownloadsPage from './pages/DownloadsPage'
import HistoryPage from './pages/HistoryPage'
import SetupPage from './pages/SetupPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/anime/:id" element={<AnimePage />} />
        <Route path="/downloads" element={<DownloadsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/setup" element={<SetupPage />} />
      </Routes>
    </>
  )
}
