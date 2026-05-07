import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Messages from './pages/Messages'
import Signup from './pages/Signup'
import PostItem from './pages/PostItem'
import MoveOutSale from './pages/MoveOutSale'
import ListingDetail from './pages/ListingDetail'
import RoommateFinder from './pages/RoommateFinder'
import RoommateDetail from './pages/RoommateDetail'
import PostRoomVacancy from './pages/PostRoomVacancy'
import RoomVacancyDetail from './pages/RoomVacancyDetail'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/post-item" element={<PostItem />} />
        <Route path="/post-room-vacancy" element={<PostRoomVacancy />} />
        <Route path="/roommates" element={<RoommateFinder />} />
        <Route path="/roommates/:id" element={<RoommateDetail />} />
        <Route path="/room-vacancies/:id" element={<RoomVacancyDetail />} />
        <Route path="/moveout-sale" element={<MoveOutSale />} />
        <Route path="/moveout-sale/:id" element={<ListingDetail />} />
      </Routes>
    </Router>
  )
}

export default App
