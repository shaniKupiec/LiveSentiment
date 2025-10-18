# Testing NLP Analysis Flow

## Step 1: Create a Test Question with NLP Features

First, create an OpenEnded question with NLP analysis enabled:

```bash
curl -X POST "http://localhost:5000/api/presentations/{presentationId}/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "text": "What did you think about this presentation?",
    "type": 6,
    "configuration": {
      "maxLength": 500,
      "minLength": 10,
      "placeholder": "Please share your thoughts..."
    },
    "enableSentimentAnalysis": true,
    "enableEmotionAnalysis": true,
    "enableKeywordExtraction": true,
    "order": 1
  }'
```

## Step 2: Start the Question (Make it Live)

```bash
curl -X POST "http://localhost:5000/api/questions/{questionId}/start" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 3: Submit a Test Response

```bash
curl -X POST "http://localhost:5000/api/audience/questions/{questionId}/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "I really enjoyed this presentation! It was very informative and engaging.",
    "sessionId": "test-session-123"
  }'
```

## Step 4: Check the Response Analysis

```bash
curl -X GET "http://localhost:5000/api/questions/{questionId}/responses" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Results

The response should have:
- `analysisCompleted: true`
- `analysisProvider: "groq"`
- `analysisResults` containing sentiment, emotion, and keywords
- `analysisTimestamp` set to when analysis was completed

## Troubleshooting

1. **Check logs** for any Groq API key configuration messages
2. **Verify question type** is OpenEnded (6) or WordCloud (7)
3. **Ensure NLP features** are enabled on the question
4. **Check response length** is at least 3 characters
5. **Verify API key** is properly configured in .env file
