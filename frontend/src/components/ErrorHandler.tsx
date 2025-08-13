import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ApiError } from '../types/error';
import { DEFAULT_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from '../types/error';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorContextType {
  showError: (error: ApiError | string) => void;
  clearError: () => void;
  currentError: string | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const showError = (error: ApiError | string) => {
    let userMessage: string;

    if (typeof error === 'string') {
      userMessage = error;
    } else if (error.userMessage) {
      userMessage = error.userMessage;
    } else if (error.status === 0 || error.message.includes('fetch')) {
      userMessage = NETWORK_ERROR_MESSAGE;
    } else if (error.status && error.status >= 500) {
      userMessage = SERVER_ERROR_MESSAGE;
    } else {
      userMessage = DEFAULT_ERROR_MESSAGE;
    }

    setCurrentError(userMessage);
  };

  const clearError = () => {
    setCurrentError(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (errorRef.current && !errorRef.current.contains(event.target as Node)) {
        clearError();
      }
    };

    if (currentError) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentError]);

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError }}>
      {children}
      <Dialog
        open={!!currentError}
        onClose={clearError}
        PaperProps={{
          ref: errorRef,
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            minWidth: 340,
            boxShadow: '0 8px 32px rgba(40,40,40,0.25)'
          },
          elevation: 8
        }}
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #ff1744 0%, #e53935 100%)',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            fontWeight: 600,
            py: 1.5,
            pr: 5
          }}
          id="error-dialog-title"
        >
          <ErrorOutlineIcon sx={{ mr: 1, fontSize: 28 }} />
          Error
          <IconButton
            onClick={clearError}
            aria-label="close"
            edge="end"
            size="small"
            sx={{
              color: 'white',
              marginLeft: 'auto',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3, px: 4, bgcolor: '#fff' }}>
          <Typography
            id="error-dialog-description"
            variant="body1"
            sx={{ textAlign: 'center', color: '#333', mb: 2 }}
          >
            {currentError}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={clearError}
            variant="contained"
            color="error"
            sx={{
              px: 5,
              py: 1.5,
              fontWeight: 500,
              fontSize: 16,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none'
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorContext.Provider>
  );
};
