import React from "react";
import { Typography, Box, Button, AppBar, Toolbar, Container, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AudienceViewProps {
  user: User | null;
  onLogout: () => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

const AudienceView: React.FC<AudienceViewProps> = ({ user, onLogout }) => (
  <Box>
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          LiveSentiment - Audience View
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
        Welcome to LiveSentiment!
      </Typography>
      
      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Join a Presentation
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is where you'll join presentations, participate in polls, and provide real-time feedback.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Features coming soon: Join presentations via code, participate in live polls, and view real-time results.
        </Typography>
      </StyledPaper>

      <StyledPaper>
        <Typography variant="h6" gutterBottom>
          Active Presentations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No active presentations available.
        </Typography>
      </StyledPaper>
    </Container>
  </Box>
);

export default AudienceView; 