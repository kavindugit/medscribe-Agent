import React from 'react'
import { Routes , Route } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/ChatPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserProfile from './pages/UserProfile'
import Pricing from './pages/Pricing'
import Payment from './pages/Payment'
import Dev from './pages/Dev'
import Features from './pages/Features'
import NavBar from './components/NavBar'

const App = () => {
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/dev' element={<Dev />} />
        <Route path='/login' element={<Login />} />
        <Route path='/chat' element={<Chat />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/profile' element={<UserProfile />} />
        <Route path='/pricing' element={<Pricing />} />
  <Route path='/features' element={<Features />} />
        <Route path='/payment/:planType' element={<Payment />} />
        

      </Routes>
 
    </div>
  )
}

export default App