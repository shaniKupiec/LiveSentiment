# Start Presentation Feature

This document describes the new "Start Presentation" functionality that allows presenters to generate shareable links and QR codes for their presentations.

## Overview

The Start Presentation feature enables presenters to:
- Generate shareable links for their presentations
- Create QR codes that audiences can scan to join presentations
- Allow audiences to access presentation content without authentication

## Features

### 1. Start Presentation Button
- Added to each presentation in the Presentations Management table
- Green "Start" button with play icon
- Opens a dialog with sharing options

### 2. Sharing Options
- **Link Sharing**: Copy a direct link to the presentation
- **QR Code**: Generate and download a QR code for easy mobile access

### 3. Audience Access
- Audiences can access presentations via `/audience/{presentationId}` route
- No authentication required for public presentation access
- Shows presentation title and available questions
- Real-time updates when questions are added

## Technical Implementation

### Components Added
- `StartPresentationDialog.tsx`: Main dialog for sharing options
- `environment.ts`: Configuration for environment-specific URLs

### Components Modified
- `PresentationsManagement.tsx`: Added Start button and dialog integration
- `AudienceView.tsx`: Enhanced to handle presentation-specific routes
- `App.tsx`: Added new route for public audience access

### Dependencies Added
- `qrcode`: For QR code generation
- `@types/qrcode`: TypeScript definitions

## URL Structure

### Development Environment
- Base URL: `http://localhost:3000`
- Audience URL: `http://localhost:3000/audience/{presentationId}`

### Production Environment
- Base URL: Uses `window.location.origin`
- Audience URL: `{domain}/audience/{presentationId}`

## Usage

### For Presenters
1. Navigate to Presentations Management
2. Click the green "Start" button next to any presentation
3. Choose between Link or QR Code sharing
4. Copy the link or download the QR code
5. Share with your audience

### For Audiences
1. Click the shared link or scan the QR code
2. View the presentation title and available questions
3. Wait for the presenter to add more questions
4. Participate in real-time Q&A

## Security Considerations

- Public access is limited to viewing presentation content and questions
- No authentication required for audience access
- Presenters must be authenticated to start presentations
- Presentation IDs are used as access tokens (consider implementing proper access controls for production)

## Future Enhancements

- Real-time question updates using WebSockets
- Answer submission functionality for audiences
- Presentation session management
- Access control and password protection
- Analytics and participation tracking
