import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import DetailPage from './pages/DetailPage';
import MyLists from './pages/MyLists';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <div className="app">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore/movies" element={<Explore type="movie" />} />
          <Route path="/explore/series" element={<Explore type="tv" />} />
          <Route path="/detail/:mediaType/:id" element={<DetailPage />} />
          <Route path="/lists/:listType" element={<MyLists />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
