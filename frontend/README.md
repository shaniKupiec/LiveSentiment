# LiveSentiment Frontend

A React-based frontend for the LiveSentiment application with authentication, real-time polling, and sentiment analysis features.

## Features

- **Authentication**: Login and signup with JWT tokens
- **Material UI**: Modern, responsive design with Material-UI components
- **Emotion Styling**: CSS-in-JS styling with Emotion
- **TypeScript**: Full type safety
- **Vite**: Fast development and build tooling

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:5261`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Testing the Authentication Flow

1. **Start the backend** (from the backend directory):
   ```bash
   cd backend
   dotnet run
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Signup**:
   - Navigate to `http://localhost:5173`
   - Click "Sign up here" or go to `/signup`
   - Fill in your details and create an account
   - You should be redirected to the presenter dashboard

4. **Test Login**:
   - Logout and go to `/login`
   - Use your credentials to sign in
   - You should be redirected to the presenter dashboard

5. **Test Authentication Persistence**:
   - Refresh the page while logged in
   - You should remain logged in and on the dashboard

## Project Structure

```
src/
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── PresenterDashboard.tsx
│   └── AudienceView.tsx
├── services/        # API services
│   └── api.ts
├── App.tsx          # Main app component with routing
└── main.tsx         # App entry point
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5261`:

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

Authentication tokens are stored in localStorage and automatically included in API requests.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **Emotion** - CSS-in-JS styling
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
