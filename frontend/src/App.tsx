import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header"
import Footer from "./components/layout/Footer"
import LandingPage from "./pages/LandingPage"
import ScanRoad from "./pages/ScanRoad"
import MapPage from "./pages/MapPage"

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/scan" element={<ScanRoad />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}

export default App
