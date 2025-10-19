# Debug NLP Analysis Step by Step

## Step 1: Check if the application is running with the new code

First, let's verify the application restarted with your changes:

1. **Restart your Docker Compose**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **Look for this log message** when the application starts:
   ```
   Groq API key configured successfully (length: 64)
   ```

## Step 2: Create a test question with NLP enabled

Use this exact JSON to create a question:

```json
{
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
}
```

**Important**: Make sure `type` is `6` (OpenEnded) and at least one NLP feature is `true`.

## Step 3: Start the question

After creating the question, make sure to **start it** (make it live).

## Step 4: Submit a test response

Submit a response with at least 3 characters:
```json
{
  "value": "I really enjoyed this presentation!",
  "sessionId": "test-session-123"
}
```

## Step 5: Check the logs

You should see these logs in order:
1. `Response submitted for question {questionId} by session {sessionId}`
2. `Processing response {ResponseId} for NLP analysis`
3. `Response text: 'I really enjoyed this presentation!' (length: 32)`
4. `Question details - Type: OpenEnded, Sentiment: True, Emotion: True, Keywords: True`
5. `Analyzing response {ResponseId} with options: Sentiment=True, Emotion=True, Keywords=True`
6. `Starting Groq analysis for text: 32 characters`

## If you don't see these logs:

The issue is likely that:
- The question type is not OpenEnded (6) or WordCloud (7)
- The NLP features are not enabled
- The response is too short (< 3 characters)
- The question is not live/active

## Quick Test Commands:

You can test the API directly with curl:

```bash
# 1. Create a question (replace {presentationId} and {token})
curl -X POST "http://localhost:5000/api/presentations/{presentationId}/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-jwt-token}" \
  -d '{
    "text": "Test NLP question",
    "type": 6,
    "configuration": {"maxLength": 500, "minLength": 10},
    "enableSentimentAnalysis": true,
    "enableEmotionAnalysis": true,
    "enableKeywordExtraction": true,
    "order": 1
  }'

# 2. Start the question (replace {questionId})
curl -X POST "http://localhost:5000/api/questions/{questionId}/start" \
  -H "Authorization: Bearer {your-jwt-token}"

# 3. Submit a response (replace {questionId})
curl -X POST "http://localhost:5000/api/audience/questions/{questionId}/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "This is a test response for NLP analysis",
    "sessionId": "test-session-123"
  }'
```
