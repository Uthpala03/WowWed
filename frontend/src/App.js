import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import GetStartedPage from './pages/GetStartedPage';
import LoginPage from './pages/LoginPage';
import WeddingProfilePage from './pages/WeddingProfilePage';
import ChatbotPage from './pages/ChatbotPage';
import DashboardPage from './pages/DashboardPage';
import { fetchApi } from './services/api';
import './App.css';

function App() {
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    fetchApi('/')
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage('Backend offline'));
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage apiMessage={apiMessage} />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/wedding-profile" element={<WeddingProfilePage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
