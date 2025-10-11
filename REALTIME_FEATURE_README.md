# 🚀 LiveSentiment - Real-time Live Presentation Feature

## 📋 **Overview**

The LiveSentiment real-time feature enables presenters to conduct live interactive presentations with real-time audience participation. Audience members can respond to questions instantly, and presenters receive live feedback and analytics.

## 🏗️ **Architecture**

### **Backend Components**
- **SignalR Hub** (`PollHub.cs`) - Real-time communication
- **AudienceController** - Public API for audience (no auth)
- **LivePresentationController** - Authenticated API for presenters
- **Database Schema** - Live tracking fields added to existing tables

### **Frontend Components**
- **SignalR Service** - Connection management and event handling
- **React Hooks** - `useSignalR` for easy integration
- **Presenter Dashboard** - Live session management
- **Audience View** - Real-time question display and response

## 🔄 **Real-time Flow**

### **SignalR Events & Methods**

#### **Presenter → Audience Events:**
```typescript
// Events sent to audience
QuestionActivated    // Show question form
QuestionDeactivated  // Show waiting screen
LiveSessionStarted   // Session begins
LiveSessionEnded     // Show thank you message
```

#### **Audience → Presenter Events:**
```typescript
// Events sent to presenter
ResponseReceived     // New response received
AudienceCountUpdated // Audience count changed
```

#### **SignalR Methods:**
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

## 📊 **Database Schema**

### **Enhanced Tables**

#### **Presentations Table**
```sql
-- New fields added
IsLive BOOLEAN DEFAULT FALSE
LiveStartedAt TIMESTAMP NULL
LiveEndedAt TIMESTAMP NULL
```

#### **Questions Table**
```sql
-- New fields added
IsLive BOOLEAN DEFAULT FALSE
LiveStartedAt TIMESTAMP NULL
LiveEndedAt TIMESTAMP NULL
```

#### **Responses Table**
```sql
-- Enhanced for session tracking
SessionId VARCHAR(255) NULL  -- For audience session tracking
```

## 🎯 **API Endpoints**

### **Audience API (Public - No Authentication)**

#### **GET** `/api/audience/presentation/{id}`
Get presentation information for audience
```json
{
  "id": "guid",
  "title": "string",
  "presenterName": "string",
  "isLive": boolean,
  "liveStartedAt": "datetime",
  "liveEndedAt": "datetime",
  "labelName": "string",
  "labelColor": "string"
}
```

#### **GET** `/api/audience/question/{id}`
Get active question details
```json
{
  "id": "guid",
  "text": "string",
  "type": number,
  "configuration": object,
  "liveStartedAt": "datetime",
  "enableSentimentAnalysis": boolean,
  "enableEmotionAnalysis": boolean,
  "enableKeywordExtraction": boolean
}
```

#### **POST** `/api/audience/question/{id}/response`
Submit response to active question
```json
// Request
{
  "sessionId": "string",
  "value": "string"
}

// Response
{
  "success": boolean,
  "message": "string",
  "responseId": "guid",
  "timestamp": "datetime"
}
```

#### **GET** `/api/audience/question/{id}/stats`
Get response statistics (public view)
```json
{
  "questionId": "guid",
  "totalResponses": number,
  "uniqueSessions": number,
  "isLive": boolean,
  "choiceCounts": object,
  "numericStats": object,
  "yesNoCounts": object
}
```

### **Live Presentation API (Authenticated)**

#### **POST** `/api/presentations/{id}/live/start`
Start live session for presentation

#### **POST** `/api/presentations/{id}/live/stop`
Stop live session

#### **POST** `/api/presentations/{id}/live/question/{questionId}/activate`
Activate question for audience response

#### **POST** `/api/presentations/{id}/live/question/{questionId}/deactivate`
Deactivate question

#### **GET** `/api/presentations/{id}/live/question/{questionId}/results`
Get real-time results for question

#### **GET** `/api/presentations/{id}/live/status`
Get live session status

#### **GET** `/api/presentations/{id}/live/audience-count`
Get current audience count

## 🎨 **Frontend Implementation**

### **SignalR Service Usage**

```typescript
import { useSignalR } from '../hooks/useSignalR';

const {
  isConnected,
  connect,
  joinPresentation,
  submitResponse,
  onQuestionActivated,
  onResponseReceived
} = useSignalR({ autoConnect: false });

// Connect and join presentation
await connect();
await joinPresentation(presentationId);

// Listen for events
onQuestionActivated((data) => {
  // Show question to audience
  setActiveQuestion(data);
});

onResponseReceived((data) => {
  // Update presenter dashboard
  updateResults(data);
});
```

### **Presenter Dashboard Integration**

```typescript
// Live session management
const handleStartLive = async () => {
  await startLiveSession(presentationId);
};

const handleActivateQuestion = async (questionId) => {
  await activateQuestion(questionId);
};

// Real-time results
onResponseReceived((data) => {
  setResults(prev => [...prev, data]);
});
```

### **Audience View Integration**

```typescript
// Join presentation
useEffect(() => {
  const joinPresentation = async () => {
    await connect();
    await joinPresentation(presentationId);
  };
  joinPresentation();
}, []);

// Handle question activation
onQuestionActivated((data) => {
  setActiveQuestion(data);
  setState('question_active');
});

// Submit response
const handleSubmit = async () => {
  await submitResponse(questionId, response, sessionId);
};
```

## 🔧 **Configuration**

### **SignalR Configuration**

```typescript
// Default configuration
const signalRConfig = {
  baseUrl: 'http://localhost:5000',
  hubPath: '/hubs/poll',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5
};
```

### **JWT Authentication for SignalR**

```csharp
// Startup.cs - JWT configuration for SignalR
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        
        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
        {
            context.Token = accessToken;
        }
        
        return Task.CompletedTask;
    }
};
```

## 🧪 **Testing**

### **Manual Testing Flow**

1. **Start Services**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access URLs**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - PgAdmin: http://localhost:5050

3. **Test Presenter Flow**
   - Sign up/Login
   - Create presentation
   - Add questions
   - Start live session
   - Activate question

4. **Test Audience Flow**
   - Open new browser tab
   - Go to `/audience/{presentation-id}`
   - Respond to active question

### **Testing Scenarios**

#### **Happy Path**
- ✅ Presenter creates presentation with questions
- ✅ Starts live session
- ✅ Audience joins via URL
- ✅ Presenter activates question
- ✅ Audience responds
- ✅ Real-time results appear
- ✅ Presenter ends session

#### **Edge Cases**
- 🔄 Network disconnection/reconnection
- 👥 Multiple audience members
- 📱 Different question types
- ⏰ Session timeout
- 🔄 Browser refresh during live session

## 🚨 **Error Handling**

### **Connection Issues**
- Automatic reconnection with exponential backoff
- Visual connection status indicators
- Fallback to REST API for missed events

### **Session Management**
- Unique session ID generation for audience
- Duplicate response prevention
- Session validation on server side

### **Error States**
- Connection lost indicators
- Retry mechanisms
- User-friendly error messages

## 📱 **Question Types Supported**

### **1. Multiple Choice (Single)**
```json
{
  "type": 1,
  "configuration": {
    "options": ["Option 1", "Option 2", "Option 3"]
  }
}
```

### **2. Multiple Choice (Multiple)**
```json
{
  "type": 2,
  "configuration": {
    "options": ["Option 1", "Option 2", "Option 3"]
  }
}
```

### **3. Yes/No**
```json
{
  "type": 4,
  "configuration": {}
}
```

### **4. Numeric Rating**
```json
{
  "type": 3,
  "configuration": {
    "minValue": 1,
    "maxValue": 10,
    "step": 1,
    "labels": {
      "min": "Poor",
      "max": "Excellent"
    }
  }
}
```

### **5. Slider Scale**
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

### **6. Open-ended Text**
```json
{
  "type": 6,
  "configuration": {},
  "enableSentimentAnalysis": true,
  "enableEmotionAnalysis": true,
  "enableKeywordExtraction": true
}
```

### **7. Word Cloud**
```json
{
  "type": 7,
  "configuration": {},
  "enableSentimentAnalysis": true,
  "enableKeywordExtraction": true
}
```

## 🔒 **Security Considerations**

### **Authentication**
- Presenter actions require JWT authentication
- Audience actions are public (no authentication)
- Session-based response tracking prevents abuse

### **Authorization**
- Presenters can only manage their own presentations
- Server-side validation of all actions
- Secure SignalR connection with JWT tokens

### **Data Protection**
- Anonymous audience responses
- Session ID tracking for duplicate prevention
- No personal data collection from audience

## 🚀 **Deployment**

### **Environment Variables**
```bash
# Backend
ASPNETCORE_ENVIRONMENT=Production
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=livesentiment
DB_USER=postgres
DB_PASSWORD=your-password
JWT__KEY=your-jwt-secret-key
JWT__Issuer=LiveSentiment
JWT__Audience=LiveSentiment

# Frontend
VITE_API_BASE_URL=https://your-api-domain.com
```

### **Docker Deployment**
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build
```

## 📈 **Performance Considerations**

### **SignalR Optimization**
- Connection pooling
- Automatic reconnection
- Efficient event broadcasting
- Group-based messaging

### **Database Optimization**
- Indexed queries for live sessions
- Efficient response aggregation
- Connection pooling

### **Frontend Optimization**
- React hooks for efficient re-renders
- Event handler cleanup
- Connection status monitoring

## 🔮 **Future Enhancements**

### **Planned Features**
- 📊 Real-time charts and graphs
- 📱 Mobile app support
- 🎥 Video integration
- 📝 Response moderation
- 📈 Advanced analytics
- 🔄 Session recording
- 🌐 Multi-language support

### **Technical Improvements**
- Redis for SignalR scaling
- WebRTC for peer-to-peer
- Advanced NLP integration
- Real-time sentiment analysis
- Machine learning insights

## 🐛 **Troubleshooting**

### **Common Issues**

#### **SignalR Connection Failed**
- Check CORS configuration
- Verify JWT token validity
- Check network connectivity
- Review browser console for errors

#### **Questions Not Activating**
- Verify presentation is live
- Check question is active
- Confirm presenter authentication
- Review server logs

#### **Responses Not Appearing**
- Check SignalR connection status
- Verify question is live
- Confirm session ID generation
- Review database queries

### **Debug Tools**
- Browser developer tools
- SignalR connection logs
- Backend application logs
- Database query logs

## 📚 **Related Documentation**

- [DEV_README.md](./DEV_README.md) - Development setup
- [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) - Deployment guide
- [QUESTIONS_CRUD_README.md](./QUESTIONS_CRUD_README.md) - Question management
- [PRESENTATIONS_CRUD_README.md](./PRESENTATIONS_CRUD_README.md) - Presentation management

## 🤝 **Contributing**

### **Code Structure**
- Follow existing patterns
- Add proper TypeScript types
- Include error handling
- Write comprehensive tests

### **Testing**
- Test all question types
- Verify real-time functionality
- Check error scenarios
- Validate security measures

---

**Last Updated**: October 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
