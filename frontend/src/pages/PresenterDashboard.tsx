import React, { useState, useEffect } from "react";
import { Typography, Box, Button, AppBar, Toolbar, Container, Paper, Tabs, Tab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams } from "react-router-dom";
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
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);

  const { presentationId } = useParams<{ presentationId?: string }>();


  // Set presentation ID from URL params
  useEffect(() => {
    if (presentationId) {
      setSelectedPresentationId(presentationId);
      setActiveTab(0); // Switch to Presentations tab (now index 0)
    }
  }, [presentationId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePresentationSelect = (presentationId: string) => {
    setSelectedPresentationId(presentationId);
  };


  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LiveSentiment - Presenter Dashboard
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
        

        {/* Tabbed Interface */}
        <StyledPaper sx={{ mt: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Presentations" />
            <Tab label="Labels" />
          </Tabs>
          
          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <PresentationsManagement 
                onPresentationSelect={handlePresentationSelect}
                selectedPresentationId={selectedPresentationId}
              />
            )}
            {activeTab === 1 && <LabelsManagement />}
          </Box>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default PresenterDashboard; 