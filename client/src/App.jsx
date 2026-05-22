import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Medications from './pages/Medications.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';
import Layout from './components/Layout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/farmaci" element={<Medications />} />
        <Route path="/profilo" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
