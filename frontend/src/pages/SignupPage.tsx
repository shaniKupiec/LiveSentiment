import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const SignupPage: React.FC = () => (
  <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
    <Typography variant="h4" gutterBottom>Sign Up</Typography>
    <TextField label="Name" margin="normal" fullWidth />
    <TextField label="Email" margin="normal" fullWidth />
    <TextField label="Password" type="password" margin="normal" fullWidth />
    <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Sign Up</Button>
    <Button variant="text" href="/login" sx={{ mt: 1 }}>Back to Login</Button>
  </Box>
);

export default SignupPage; 