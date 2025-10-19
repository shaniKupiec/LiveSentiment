import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore,
  Analytics,
  TableChart,
  QuestionAnswer
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import type { Question } from '../types/question';
import { useQuestionResults, type QuestionResults } from '../hooks/useQuestionResults';
import DashboardTab from './tabs/DashboardTab';
import ResponsesTable from './tables/ResponsesTable';


const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: theme.spacing(1, 0),
  },
}));

const QuestionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%',
}));

const ResponseStats = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginLeft: 'auto',
}));

const TabPanel = styled(Box)(({ theme }) => ({
  height: '400px', // Fixed height as requested
  overflow: 'auto',
  padding: theme.spacing(2),
}));

interface QuestionResponseAccordionProps {
  question: Question;
  presentationId: string;
  presentationName?: string;
  isExpanded: boolean;
  onToggle: (questionId: string) => void;
  // Optional shared data - if provided, use instead of individual hook
  sharedResults?: QuestionResults | null;
  sharedLoading?: boolean;
  sharedError?: string | null;
  sharedLastUpdated?: Date | null;
  onRefresh?: () => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`question-tabpanel-${index}`}
      aria-labelledby={`question-tab-${index}`}
      {...other}
    >
      {value === index && (
        <TabPanel>
          {children}
        </TabPanel>
      )}
    </div>
  );
}

const QuestionResponseAccordion: React.FC<QuestionResponseAccordionProps> = ({
  question,
  presentationId,
  presentationName,
  isExpanded,
  onToggle,
  sharedResults,
  sharedLoading,
  sharedError,
  sharedLastUpdated,
  onRefresh
}) => {
  const [tabValue, setTabValue] = useState(0);
  
  // Use shared data if provided, otherwise fall back to individual hook
  const individualHook = useQuestionResults({
    presentationId,
    questionId: question.id,
    isExpanded: isExpanded && !sharedResults, // Only use individual hook if no shared data
    pollingInterval: 10000,
    enableRealTime: question.isLive && isExpanded,
    enablePolling: question.isLive && isExpanded
  });

  // Use shared data when available, otherwise use individual hook data
  const results = sharedResults || individualHook.results;
  const loading = sharedLoading !== undefined ? sharedLoading : individualHook.loading;
  const error = sharedError !== undefined ? sharedError : individualHook.error;
  const lastUpdated = sharedLastUpdated || individualHook.lastUpdated;
  const refresh = onRefresh || individualHook.refresh;

  

  const handleAccordionChange = () => {
    onToggle(question.id);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <StyledAccordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`question-${question.id}-content`}
        id={`question-${question.id}-header`}
      >
        <QuestionHeader>
          <QuestionAnswer color="primary" />
          <ResponseStats>
            {results && (
              <Chip
                label={`${results.totalResponses} responses`}
                size="small"
                color="primary"
              />
            )}
            {question.isLive && (
              <Chip
                label="LIVE"
                size="small"
                color="success"
              />
            )}
          </ResponseStats>
        </QuestionHeader>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 0 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="question response tabs"
            >
              <Tab
                icon={<Analytics />}
                label="Dashboard"
                id="question-tab-0"
                aria-controls="question-tabpanel-0"
              />
              <Tab
                icon={<TableChart />}
                label="Responses"
                id="question-tab-1"
                aria-controls="question-tabpanel-1"
              />
            </Tabs>
          </Box>
          
          <CustomTabPanel value={tabValue} index={0}>
            <DashboardTab
              question={question}
              results={results}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              isExpanded={isExpanded}
              onRefresh={refresh}
            />
          </CustomTabPanel>
          
          <CustomTabPanel value={tabValue} index={1}>
            <ResponsesTable
              question={question}
              results={results}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              isExpanded={isExpanded}
              onRefresh={refresh}
              presentationName={presentationName}
            />
          </CustomTabPanel>
        </Box>
      </AccordionDetails>
    </StyledAccordion>
  );
};

export default QuestionResponseAccordion;
