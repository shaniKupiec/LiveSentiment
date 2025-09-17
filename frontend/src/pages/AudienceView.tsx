import React from "react";
import { Typography, Box, AppBar, Toolbar, Container, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams } from "react-router-dom";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

const AudienceView: React.FC = () => {
  const { presentationId } = useParams<{ presentationId?: string }>();

  // Debug logging
  console.log('AudienceView rendered:', { presentationId });

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LiveSentiment - Audience View
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <StyledPaper>
          <Typography variant="h4" gutterBottom>
            This is the audience page for presentation:
          </Typography>
          <Typography variant="h6" color="primary" sx={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            {presentationId}
          </Typography>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default AudienceView; 