import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Checkin from './pages/Checkin.jsx'
import Lap from './pages/Lap.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import GateDisplay from './pages/GateDisplay.jsx'

function App() {
  return (
    <BrowserRouter>
      <nav style={{padding:'12px', display:'flex', gap:'12px', borderBottom:'1px solid #ddd'}}>
        <Link to="/">Home</Link>
        <Link to="/checkin">Check-in</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/admin/gate-display">Gate Display</Link>
      </nav>
      <div style={{padding:'16px'}}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/checkin" element={<Checkin/>} />
          <Route path="/lap" element={<Lap/>} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
          <Route path="/admin/gate-display" element={<GateDisplay/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App/></React.StrictMode>
)
