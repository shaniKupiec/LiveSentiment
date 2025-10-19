# 🚀 LiveSentiment Features Documentation

This document provides comprehensive documentation of all features in the LiveSentiment platform.

## 📋 Table of Contents

- [Real-time Features](#-real-time-features)
- [AI-Powered NLP Analysis](#-ai-powered-nlp-analysis)
- [Question Types](#-question-types)
- [Presentation Management](#-presentation-management)
- [Label System](#-label-system)
- [Authentication & Security](#-authentication--security)
- [API Architecture](#-api-architecture)
- [Performance Optimizations](#-performance-optimizations)

## 🔄 Real-time Features

### SignalR WebSocket Communication

LiveSentiment uses **SignalR** for real-time bidirectional communication between presenters and audiences.

#### **SignalR Events & Methods**

**Presenter → Audience Events:**
```typescript
QuestionActivated    // Show question form to audience
QuestionDeactivated  // Hide question, show waiting screen
LiveSessionStarted   // Session begins
LiveSessionEnded     // Show thank you message
```

**Audience → Presenter Events:**
```typescript
ResponseReceived     // New response received
AudienceCountUpdated // Audience count changed
```

**SignalR Methods:**
```typescript
// Presenter methods (authenticated)
StartLiveSession(presentationId)
EndLiveSession(presentationId)
ActivateQuestion(questionId)
DeactivateQuestion(questionId)
JoinPresenterSession(presentationId)

// Audience methods (public)
JoinPresentation(presentationId)
LeavePresentation(presentationId)
SubmitResponse(questionId, response, sessionId)
```

#### **Real-time Flow**

1. **Presenter starts live session** → SignalR broadcasts to all connected audience
2. **Presenter activates question** → Audience sees question form instantly
3. **Audience submits response** → Presenter sees response in real-time
4. **Results update live** → Charts and statistics update automatically

### Live Session Management

#### **Session States**
- `waiting` - Waiting for presenter to start
- `live` - Session is active, questions can be activated
- `ended` - Session has ended

#### **Question States**
- `inactive` - Question is not live
- `active` - Question is live and accepting responses
- `ended` - Question has been deactivated

## 🧠 AI-Powered NLP Analysis

### Overview

LiveSentiment integrates with **Groq API** for advanced Natural Language Processing of text responses.

### Supported Analysis Types

#### 1. **Sentiment Analysis**
- **Classification**: Positive, Negative, Neutral
- **Confidence Score**: 0.0 to 1.0
- **Use Cases**: Understanding overall audience mood and satisfaction

**Example:**
```
Response: "The presentation was excellent and very informative"
Sentiment: Positive (0.92 confidence)
```

#### 2. **Emotion Detection**
- **Emotions**: Joy, Sadness, Anger, Fear, Surprise, Disgust, Neutral
- **Confidence Score**: 0.0 to 1.0
- **Use Cases**: Understanding emotional responses and engagement levels

**Example:**
```
Response: "The presentation was excellent and very informative"
Emotion: Joy (0.88 confidence)
```

#### 3. **Keyword Extraction**
- **Keywords**: Important terms and phrases from responses
- **Relevance Score**: 0.0 to 1.0
- **Use Cases**: Identifying key topics, themes, and concepts

**Example:**
```
Response: "The presentation was excellent and very informative"
Keywords: ["presentation", "excellent", "informative"]
```

### NLP Configuration

#### **Per-Question Configuration**
```typescript
interface QuestionNLPConfig {
  enableSentimentAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  enableKeywordExtraction: boolean;
}
```

#### **Analysis Results Structure**
```json
{
  "sentiment": {
    "label": "positive",
    "confidence": 0.92
  },
  "emotion": {
    "label": "joy",
    "confidence": 0.88
  },
  "keywords": [
    {
      "text": "presentation",
      "relevance": 0.95
    },
    {
      "text": "excellent",
      "relevance": 0.92
    },
    {
      "text": "informative",
      "relevance": 0.88
    }
  ]
}
```

### NLP Service Architecture

#### **NLP Service**
- **Primary**: Groq API for fast inference
- **Error Handling**: Graceful degradation when services unavailable

#### **Analysis Pipeline**
1. **Response Submission** → Trigger analysis
2. **Text Processing** → Clean and prepare text
3. **AI Analysis** → Send to NLP services
4. **Result Storage** → Save analysis results
5. **Real-time Updates** → Broadcast to presenter

## 📝 Question Types

### 1. **Single Choice**
- **Type ID**: 1
- **Configuration**: Options array, allow other option
- **Use Cases**: Single answer selection from predefined options

```json
{
  "type": 1,
  "configuration": {
    "options": ["Option 1", "Option 2", "Option 3"],
    "allowOther": false
  }
}
```

### 2. **Multiple Choice**
- **Type ID**: 2
- **Configuration**: Options array, multiple selection
- **Use Cases**: Multiple answer selection

```json
{
  "type": 2,
  "configuration": {
    "options": ["Option 1", "Option 2", "Option 3"],
    "allowOther": true
  }
}
```

### 3. **Numeric Rating**
- **Type ID**: 3
- **Configuration**: Min/max values, step size, labels
- **Use Cases**: Scale-based ratings (1-10, 1-5, etc.)

```json
{
  "type": 3,
  "configuration": {
    "minValue": 1,
    "maxValue": 10,
    "stepSize": 1,
    "labels": {
      "1": "Very Poor",
      "5": "Average",
      "10": "Excellent"
    }
  }
}
```

### 4. **Yes/No**
- **Type ID**: 4
- **Configuration**: Simple binary choice
- **Use Cases**: Quick yes/no questions

```json
{
  "type": 4,
  "configuration": {}
}
```

### 5. **Slider Scale**
- **Type ID**: 5
- **Configuration**: Continuous scale with custom range
- **Use Cases**: Precise value selection

```json
{
  "type": 5,
  "configuration": {
    "minValue": 0,
    "maxValue": 100,
    "step": 5,
    "labels": {
      "min": "Not at all",
      "max": "Completely"
    }
  }
}
```

### 6. **Open Ended**
- **Type ID**: 6
- **Configuration**: Text input with NLP analysis
- **Use Cases**: Free-form feedback with AI insights

```json
{
  "type": 6,
  "configuration": {
    "maxLength": 500,
    "minLength": 10,
    "placeholder": "Please share your thoughts..."
  },
  "enableSentimentAnalysis": true,
  "enableEmotionAnalysis": true,
  "enableKeywordExtraction": true
}
```

### 7. **Word Cloud**
- **Type ID**: 7
- **Configuration**: Short text optimized for keywords
- **Use Cases**: Keyword collection and analysis

```json
{
  "type": 7,
  "configuration": {
    "maxWords": 3,
    "minWordLength": 2,
    "placeholder": "Enter 1-3 words"
  },
  "enableSentimentAnalysis": true,
  "enableKeywordExtraction": true
}
```

## 📊 Presentation Management

### CRUD Operations

#### **Create Presentation**
- **Title**: Required, max 255 characters
- **Label**: Required, select from available labels
- **Validation**: Real-time form validation

#### **Edit Presentation**
- **Update Title**: Modify presentation title
- **Change Label**: Switch to different label
- **Validation**: Same validation as creation

#### **Delete Presentation**
- **Confirmation**: Warning about cascading deletion
- **Cascade**: Removes all questions and responses
- **Protection**: Cannot be undone

### Search and Filtering

#### **Search Features**
- **Title Search**: Real-time search by presentation title
- **Label Filter**: Filter by presentation label
- **Combined**: Search and filter work together

#### **Sorting Options**
- **Created Date**: Sort by creation time
- **Last Updated**: Sort by modification time
- **Ascending/Descending**: Toggle sort order

### Presentation Sharing

#### **Start Presentation**
- **Shareable Links**: Generate direct links to presentations
- **QR Codes**: Create QR codes for mobile access
- **Public Access**: Audiences can join without registration

#### **Audience URLs**
- **Format**: `/audience/{presentationId}`
- **Access**: No authentication required
- **Real-time**: Live updates when questions are added

## 🏷️ Label System

### Label Management

#### **Create Labels**
- **Name**: Required, max 100 characters
- **Color**: Select from 15 predefined colors
- **Active Status**: Enable/disable labels

#### **Color Palette**
- **Primary**: Blue (#3B82F6), Red (#EF4444), Green (#10B981)
- **Secondary**: Yellow (#F59E0B), Purple (#8B5CF6), Orange (#F97316)
- **Accent**: Cyan (#06B6D4), Pink (#EC4899), Lime (#84CC16)
- **Neutral**: Gray (#6B7280), Dark Gray (#1F2937)

#### **Smart Deletion**
- **Usage Protection**: Cannot delete labels assigned to presentations
- **Warning System**: Clear indication when deletion not allowed
- **Presentation Count**: Shows usage statistics

### Label Features

#### **Visual Indicators**
- **Color Coding**: Consistent color scheme across interface
- **Usage Statistics**: Show how many presentations use each label
- **Active/Inactive**: Toggle label availability

## 🔐 Authentication & Security

### JWT Authentication

#### **Token Structure**
- **Issuer**: LiveSentiment
- **Audience**: LiveSentiment
- **Expiration**: Configurable token lifetime
- **Secret Key**: Secure random key (32+ characters)

#### **Authentication Flow**
1. **Login/Signup** → Validate credentials
2. **Token Generation** → Create JWT token
3. **Token Storage** → Store in localStorage
4. **API Requests** → Include token in Authorization header
5. **Token Validation** → Verify on each request

### Security Features

#### **Input Validation**
- **Frontend**: Real-time form validation
- **Backend**: Server-side validation
- **XSS Prevention**: Proper text escaping
- **SQL Injection**: Entity Framework protection

#### **Access Control**
- **User Isolation**: Users can only access their own data
- **Presentation Ownership**: Presenters own their presentations
- **Public Access**: Controlled public access for audiences

#### **CORS Configuration**
- **Development**: Allow localhost origins
- **Production**: Restrict to deployed domains
- **API Protection**: Secure API endpoints

## 🏗️ API Architecture

### RESTful Endpoints

#### **Authentication**
```typescript
POST /api/auth/login      // User login
POST /api/auth/signup     // User registration
POST /api/auth/refresh    // Token refresh
```

#### **Presentations**
```typescript
GET    /api/presentations                    // List user presentations
POST   /api/presentations                    // Create presentation
GET    /api/presentations/{id}               // Get presentation
PUT    /api/presentations/{id}               // Update presentation
DELETE /api/presentations/{id}               // Delete presentation
```

#### **Questions**
```typescript
GET    /api/presentations/{id}/questions     // List questions
POST   /api/presentations/{id}/questions     // Create question
GET    /api/questions/{id}                   // Get question
PUT    /api/questions/{id}                   // Update question
DELETE /api/questions/{id}                   // Delete question
PUT    /api/questions/{id}/toggle            // Toggle active status
```

#### **Live Sessions**
```typescript
POST /api/presentations/{id}/live/start                    // Start live session
POST /api/presentations/{id}/live/stop                     // Stop live session
POST /api/presentations/{id}/live/question/{qId}/activate  // Activate question
POST /api/presentations/{id}/live/question/{qId}/deactivate // Deactivate question
GET  /api/presentations/{id}/live/status                   // Get session status
```

#### **Audience API (Public)**
```typescript
GET  /api/audience/presentation/{id}           // Get presentation info
GET  /api/audience/question/{id}               // Get question details
POST /api/audience/question/{id}/response      // Submit response
GET  /api/audience/question/{id}/stats         // Get response statistics
```

### Error Handling

#### **Standardized Error Format**
```json
{
  "errorCode": "AUTH_001",
  "message": "User not authenticated",
  "userMessage": "Please log in to access your presentations.",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### **Error Codes**
- **Authentication (AUTH_***)**: UNAUTHORIZED, INVALID_CREDENTIALS
- **Validation (VAL_***)**: VALIDATION_ERROR, INVALID_INPUT
- **Resources (RES_***)**: NOT_FOUND, ALREADY_EXISTS
- **Server (SRV_***)**: INTERNAL_ERROR, DATABASE_ERROR

## ⚡ Performance Optimizations

### Optimized Polling System

#### **Before vs After**
| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **API Calls** | 5 questions × 6 calls/min = 30 calls/min | 1 shared × 6 calls/min = 6 calls/min | **80% reduction** |
| **Intervals** | 5 separate 10-second intervals | 1 shared 10-second interval | **80% reduction** |
| **Redundancy** | Polling + SignalR simultaneously | SignalR primary, polling backup | **Eliminated** |

#### **Smart Polling Strategy**
1. **Primary**: SignalR real-time updates
2. **Backup**: Shared polling when SignalR disconnected
3. **Fallback**: Individual polling for standalone components

### Data Management

#### **Caching Strategy**
- **Question Results**: Cached in memory for fast access
- **Presentation Data**: Cached with invalidation
- **User Sessions**: Efficient session management

#### **Database Optimization**
- **Indexed Queries**: Optimized for live sessions
- **Connection Pooling**: Efficient database connections
- **Migration System**: Automated schema updates

### Frontend Performance

#### **React Optimizations**
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Load components on demand
- **State Management**: Efficient state updates

#### **Chart Performance**
- **Data Limiting**: Limit chart data points
- **Auto-scaling**: Adjust intervals based on data volume
- **Efficient Rendering**: Optimized chart updates

## 🔧 Configuration

### Environment Variables

#### **Backend Configuration**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=livesentiment
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_KEY=your-super-secret-key-32-chars-min
JWT_ISSUER=LiveSentiment
JWT_AUDIENCE=LiveSentiment

# NLP Services
GROQ_API_KEY=your-groq-api-key
```

#### **Frontend Configuration**
```bash
# API
VITE_API_URL=http://localhost:5000
```

### Feature Flags

#### **NLP Features**
- **Enable Sentiment Analysis**: Toggle sentiment analysis
- **Enable Emotion Detection**: Toggle emotion analysis
- **Enable Keyword Extraction**: Toggle keyword extraction

#### **Real-time Features**
- **Enable SignalR**: Toggle real-time communication
- **Enable Polling**: Toggle backup polling
- **Enable Live Sessions**: Toggle live presentation features

## 🚀 Deployment

### Production Architecture

#### **Services**
- **Backend**: ASP.NET Core on Render.com
- **Frontend**: React build on Render.com
- **Database**: PostgreSQL managed by Render
- **CDN**: Static asset delivery

#### **Monitoring**
- **Health Checks**: Service availability monitoring
- **Error Tracking**: Application error monitoring
- **Performance**: Response time monitoring

### Scaling Considerations

#### **SignalR Scaling**
- **Connection Limits**: Handle concurrent connections
- **Message Broadcasting**: Efficient message distribution
- **Redis Backplane**: Multi-instance SignalR support

#### **Database Scaling**
- **Connection Pooling**: Efficient connection management
- **Query Optimization**: Optimized database queries
- **Indexing**: Proper database indexing

## 🔮 Future Enhancements

### Planned Features

#### **Advanced Analytics**
- **Response Trends**: Historical analysis over time
- **Audience Insights**: Demographic analysis
- **Performance Metrics**: Engagement analytics

#### **Enhanced Real-time**
- **Video Integration**: Live video streaming
- **Screen Sharing**: Presentation screen sharing
- **Multi-language**: Internationalization support

#### **AI Improvements**
- **Custom Models**: Domain-specific AI models
- **Topic Modeling**: Automatic topic identification
- **Predictive Analytics**: Response prediction

### Technical Improvements

#### **Performance**
- **Redis Caching**: Advanced caching strategies
- **CDN Integration**: Global content delivery
- **Microservices**: Service decomposition

#### **Security**
- **OAuth Integration**: Social login support
- **Rate Limiting**: API rate limiting
- **Audit Logging**: Comprehensive audit trails

---

**For development setup and local configuration, see [DEV.md](./DEV.md)**
