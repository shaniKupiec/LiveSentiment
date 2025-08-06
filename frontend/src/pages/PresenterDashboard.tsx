import React from "react";
import { Typography, Box, Button, AppBar, Toolbar, Container, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

interface User {
  id: string;
  name: string;
  email: string;
}

interface PresenterDashboardProps {
  user: User | null;
  onLogout: () => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

const PresenterDashboard: React.FC<PresenterDashboardProps> = ({ user, onLogout }) => (
  <Box>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LiveSentiment - Presenter Dashboard
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Welcome, {user?.name}
        </Typography>
        <Button color="inherit" onClick={onLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>

    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is where you'll manage your presentations, create polls, and view real-time sentiment analysis.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Features coming soon: Create presentations, manage polls, view audience responses, and real-time analytics.
        </Typography>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recent activity to display.
        </Typography>
      </StyledPaper>
    </Container>
  </Box>
);

export default PresenterDashboard; 