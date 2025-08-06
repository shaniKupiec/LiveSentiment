import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Link,
  Container,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { styled } from "@mui/material/styles";
import apiService, { type LoginRequest, type AuthResponse } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 450,
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
  backdropFilter: "blur(10px)",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxSizing: "border-box",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "calc(100% - 16px)",
    margin: "0 8px",
    borderRadius: 12,
  },
}));

const GradientBackground = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
  boxSizing: "border-box",
  overflow: "hidden",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    "&.Mui-focused": {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 3),
  fontSize: "1.1rem",
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
  "&:hover": {
    boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.2, 2.5),
    fontSize: "1rem",
  },
}));

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: "",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiService.login(formData);

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
      }));
      localStorage.setItem("role", "presenter");

      // Update auth context
      login({
        id: data.id,
        name: data.name,
        email: data.email,
      }, "presenter");

      // Redirect to presenter dashboard
      navigate("/presenter");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <Container 
        maxWidth="sm" 
        sx={{ 
          p: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          [theme.breakpoints.down("sm")]: {
            px: 0,
            mx: 0,
          }
        }}
      >
        <StyledCard>
          <CardContent 
            sx={{ 
              padding: isMobile ? 3 : 4,
              "&:last-child": { pb: isMobile ? 3 : 4 },
              boxSizing: "border-box",
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              gutterBottom
              align="center"
              sx={{ 
                fontWeight: 700, 
                color: "primary.main", 
                mb: isMobile ? 2 : 3,
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </Typography>

            <Typography
              variant="body2"
              align="center"
              sx={{ 
                mb: 3, 
                color: "text.secondary",
                opacity: 0.8
              }}
            >
              Sign in to your account to continue
            </Typography>

            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": {
                    fontWeight: 500
                  }
                }}
              >
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange("email")}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange("password")}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isLoading}
                sx={{ mb: 3 }}
              />
              <StyledButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{ mb: 3 }}
              >
                {isLoading ? <CircularProgress size={24} /> : "Sign In"}
              </StyledButton>
              
              <Box textAlign="center">
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 500,
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 600,
                      "&:hover": {
                        textDecoration: "underline"
                      }
                    }
                  }}
                >
                  Don't have an account?{" "}
                  <Link component={RouterLink} to="/signup" variant="body2">
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Container>
    </GradientBackground>
  );
};

export default LoginPage; 