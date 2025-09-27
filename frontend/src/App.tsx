import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Chat from './components/Chat'
import './App.css'

function App() {
  return (
    <Router>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              myJarvis
            </Typography>
            <Button color="inherit" component={RouterLink} to="/">
              Dashboard
            </Button>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/chat">
              Chat
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  )
}

export default App
