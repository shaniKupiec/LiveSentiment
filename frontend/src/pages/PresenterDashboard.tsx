import React, { useState } from "react";
import { Typography, Box, Button, AppBar, Toolbar, Container, Paper, Tabs, Tab } from "@mui/material";
import { styled } from "@mui/material/styles";
import PresentationsManagement from "../components/PresentationsManagement";
import LabelsManagement from "../components/LabelsManagement";

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

const PresenterDashboard: React.FC<PresenterDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
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
        </StyledPaper>

        {/* Tabbed Interface */}
        <StyledPaper sx={{ mt: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Presentations" />
            <Tab label="Labels" />
            <Tab label="Polls" />
            <Tab label="Analytics" />
          </Tabs>
          
          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && <PresentationsManagement />}
            {activeTab === 1 && <LabelsManagement />}
            {activeTab === 2 && (
              <Typography variant="body1" color="text.secondary">
                Polls management coming soon...
              </Typography>
            )}
            {activeTab === 3 && (
              <Typography variant="body1" color="text.secondary">
                Analytics dashboard coming soon...
              </Typography>
            )}
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default PresenterDashboard; 