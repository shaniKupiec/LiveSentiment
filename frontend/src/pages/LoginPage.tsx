import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const LoginPage: React.FC = () => (
  <Box display="flex" flexDirection="column" alignItems="center" mt={8}>
    <Typography variant="h4" gutterBottom>Login</Typography>
    <TextField label="Email" margin="normal" fullWidth />
    <TextField label="Password" type="password" margin="normal" fullWidth />
    <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
    <Button variant="text" href="/signup" sx={{ mt: 1 }}>Sign Up</Button>
  </Box>
);

export default LoginPage; 