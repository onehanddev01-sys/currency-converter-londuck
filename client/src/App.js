import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Navbar from './components/Navbar';
import Converter from './components/Converter';
import History from './components/History';
import Favorites from './components/Favorites';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Converter />} />
              <Route path="/history" element={<History />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;