import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { getAudienceUrl } from '../config/environment';

interface StartPresentationDialogProps {
  open: boolean;
  onClose: () => void;
  presentation: {
    id: string;
    title: string;
  } | null;
}

const StartPresentationDialog: React.FC<StartPresentationDialogProps> = ({
  open,
  onClose,
  presentation,
}) => {
  const [shareType, setShareType] = useState<'link' | 'qr'>('link');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate audience URL based on environment
  const audienceUrl = presentation ? getAudienceUrl(presentation.id) : '';

  // Generate QR code when dialog opens and QR option is selected
  useEffect(() => {
    if (open && shareType === 'qr' && presentation) {
      generateQRCode();
    }
  }, [open, shareType, presentation]);

  const generateQRCode = async () => {
    if (!presentation) return;
    
    setQrCodeLoading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(audienceUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleShareTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as 'link' | 'qr';
    setShareType(newType);
    
    if (newType === 'qr' && !qrCodeDataUrl) {
      generateQRCode();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(audienceUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `presentation-${presentation?.id}-qr.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!presentation) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          Start Presentation: {presentation.title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Share this with your audience so they can join your presentation and answer questions.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Choose how to share:
          </Typography>
          <RadioGroup
            value={shareType}
            onChange={handleShareTypeChange}
            sx={{ flexDirection: 'row', gap: 2 }}
          >
            <FormControlLabel
              value="link"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon />
                  <Typography>Share Link</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="qr"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCodeIcon />
                  <Typography>QR Code</Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>

        {shareType === 'link' && (
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              Audience Link:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={audienceUrl}
                fullWidth
                size="small"
                InputProps={{
                  readOnly: true,
                  sx: { 
                    backgroundColor: 'white',
                    '& .MuiInputBase-input': { 
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }
                  }
                }}
              />
              <Tooltip title={copySuccess ? "Copied!" : "Copy link"}>
                <IconButton 
                  onClick={handleCopyLink}
                  color={copySuccess ? "success" : "primary"}
                  size="small"
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {copySuccess && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                Link copied to clipboard!
              </Typography>
            )}
          </Paper>
        )}

        {shareType === 'qr' && (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              QR Code for Audience:
            </Typography>
            {qrCodeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
                <CircularProgress />
              </Box>
            ) : qrCodeDataUrl ? (
              <Box>
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code for presentation" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDownloadQR}
                    startIcon={<QrCodeIcon />}
                  >
                    Download QR
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCopyLink}
                    startIcon={<CopyIcon />}
                  >
                    Copy Link
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Failed to generate QR code
              </Typography>
            )}
          </Paper>
        )}

      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
            }
          }}
        >
          Start Presentation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartPresentationDialog;
