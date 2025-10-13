import React from 'react'
import { Routes , Route } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/ChatPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserProfile from './pages/UserProfile'
import Pricing from './pages/Pricing'
import Payment from './pages/Payment'

const App = () => {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/login' element={<Login />} />
        <Route path='/chat' element={<Chat />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/profile' element={<UserProfile />} />
        <Route path='/pricing' element={<Pricing />} />
        <Route path='/payment/:planType' element={<Payment />} />

      </Routes>
 
    </div>
  )
}

export default App