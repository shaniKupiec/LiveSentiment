import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress
} from '@mui/material';
import QuestionsManagement from '../components/QuestionsManagement';
import type { Question } from '../types/question';
import type { Presentation } from '../types/presentation';

const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);

  // In a real app, you would fetch the presentation from the backend
  useEffect(() => {
    // Mock presentation data - replace with actual API call
    setPresentation({
      id: 'demo-presentation-1',
      title: 'Customer Satisfaction Survey',
      createdDate: '2024-01-15T10:00:00Z',
      lastUpdated: '2024-01-15T10:00:00Z',
      labelId: 'label-1',
      label: {
        id: 'label-1',
        name: 'Customer Feedback',
        color: '#1976d2',
        isActive: true
      }
    });
  }, []);

  const handleQuestionsChange = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    // In a real app, you would sync with the backend here
    console.log('Questions updated:', newQuestions);
  };

  if (!presentation) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Questions Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage questions for your presentations. Add, edit, and configure questions with various types and NLP analysis options.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <QuestionsManagement
          presentation={presentation}
          questions={questions}
          onQuestionsChange={handleQuestionsChange}
          isLoading={isLoading}
        />
      </Paper>

      {/* Demo Information */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demo Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This is a demonstration of the Questions Management system. Start by adding your first question using the "Add Question" button above.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Features available:
        </Typography>
        <ul>
          <li>Multiple question types (Numeric Rating, Open Ended, Multiple Choice, etc.)</li>
          <li>NLP configuration options for text analysis</li>
          <li>Question ordering and management</li>
          <li>Type-specific configuration forms</li>
          <li>Add, edit, and delete operations</li>
        </ul>
      </Paper>
    </Container>
  );
};

export default QuestionsPage;
