import React from 'react';
import { Grid, Container, Box } from '@mui/material';
import TodayTasksPanel from './TodayTasksPanel';
import LifelogInput from './LifelogInput';
import AIChat from '../AIChat';

const DashboardLayout: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Today's Tasks Panel */}
        <Grid item xs={12} md={6}>
          <TodayTasksPanel />
        </Grid>

        {/* Lifelog Input */}
        <Grid item xs={12} md={6}>
          <LifelogInput />
        </Grid>

        {/* AI Chat Panel */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ height: 600 }}>
            <AIChat />
          </Box>
        </Grid>

        {/* Additional panels can be added here */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ height: 600, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            {/* Calendar view and other features will be added here */}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardLayout;