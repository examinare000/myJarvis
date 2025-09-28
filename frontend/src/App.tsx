import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@lib/queryClient'
import Dashboard from './components/Dashboard'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Login from './components/Login'
import Chat from './components/Chat'
import CalendarContainer from './components/Calendar/CalendarContainer'
import './App.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              <Button color="inherit" component={RouterLink} to="/calendar">
                Calendar
              </Button>
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/" element={<DashboardLayout />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/calendar" element={<CalendarContainer />} />
          </Routes>
        </Box>
      </Router>
    </QueryClientProvider>
  )
}

export default App
