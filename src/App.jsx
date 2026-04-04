import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Scanner from './pages/Scanner'
import Profile from './pages/Profile'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="profile" element={<Profile />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="settings" element={<div className="p-4">設定 (未実装)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
