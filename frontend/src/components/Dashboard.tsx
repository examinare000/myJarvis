import React from 'react'
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material'

const Dashboard: React.FC = () => {
  return (
    <Stack spacing={4} sx={{ mt: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          This is where your assistant insights, shortcuts, and tasks will live.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2} direction="row" flexWrap="wrap">
              <Button variant="contained">Start Conversation</Button>
              <Button variant="outlined">Create Task</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity feed will appear here once data is available.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Integrations, analytics, and AI-driven insights will be displayed in this space.
        </Typography>
      </Paper>
    </Stack>
  )
}

export default Dashboard
