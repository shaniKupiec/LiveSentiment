# Labels CRUD Frontend Implementation

This document describes the label CRUD (Create, Read, Update, Delete) functionality that has been added to the LiveSentiment frontend.

## Overview

The label management system allows presenters to create, edit, and delete labels that can be assigned to presentations. Labels include a name and a color, and can be marked as active or inactive.

## Features

### 1. Label Management
- **Create Labels**: Add new labels with custom names and colors
- **Edit Labels**: Modify existing label names, colors, and active status
- **Delete Labels**: Remove labels (only if not assigned to presentations)
- **View Labels**: See all labels with their details and usage statistics

### 2. Color Selection
- **Predefined Colors**: 15 carefully selected colors for consistent design
- **Visual Picker**: Click-based color selection with visual feedback
- **Color Preview**: Shows selected color with hex code

### 3. Smart Deletion
- **Usage Protection**: Labels cannot be deleted if assigned to presentations
- **Warning System**: Clear indication when deletion is not allowed
- **Presentation Count**: Shows how many presentations use each label

## Components

### LabelsManagement.tsx
Main component that handles the label CRUD operations and displays the list of labels.

**Features:**
- Fetches labels from the backend API
- Manages create/edit form visibility
- Handles label operations (create, update, delete)
- Displays labels in a clean, organized list
- Shows error messages and loading states

### LabelForm.tsx
Form component for creating and editing labels.

**Features:**
- Input field for label name (max 100 characters)
- Color picker with 15 predefined colors
- Active/inactive toggle (for editing only)
- Form validation and submission handling
- Responsive design with Material-UI components

## API Integration

The frontend integrates with the backend label API endpoints:

- `GET /api/labels` - Fetch all user labels
- `POST /api/labels` - Create new label
- `PUT /api/labels/{id}` - Update existing label
- `DELETE /api/labels/{id}` - Delete label
- `GET /api/labels/{id}/presentations` - Get label with presentations

## Color Palette

The system includes 15 predefined colors:
- Primary: Blue (#3B82F6), Red (#EF4444), Green (#10B981)
- Secondary: Yellow (#F59E0B), Purple (#8B5CF6), Orange (#F97316)
- Accent: Cyan (#06B6D4), Pink (#EC4899), Lime (#84CC16)
- Neutral: Gray (#6B7280), Dark Gray (#1F2937)
- Dark: Dark Red (#DC2626), Dark Green (#059669), Dark Yellow (#D97706), Dark Purple (#7C3AED)

## Usage

### Accessing Labels Management
1. Log in as a presenter
2. Navigate to the Presenter Dashboard
3. Click on the "Labels" tab
4. Use the interface to manage your labels

### Creating a Label
1. Click "Create New Label" button
2. Enter a label name (required)
3. Select a color from the color picker
4. Click "Create Label"

### Editing a Label
1. Click the edit icon (pencil) next to any label
2. Modify the name, color, or active status
3. Click "Update Label"

### Deleting a Label
1. Click the delete icon (trash) next to any label
2. Confirm deletion in the dialog
3. Note: Labels assigned to presentations cannot be deleted

## Technical Details

### Dependencies
- Material-UI (MUI) for UI components
- date-fns for date formatting
- React hooks for state management

### State Management
- Local state for form data and UI state
- API calls for CRUD operations
- Error handling and loading states

### Styling
- Material-UI theme system
- Responsive design
- Consistent with existing application design

## Future Enhancements

Potential improvements for the label system:
- Bulk operations (delete multiple labels)
- Label categories or tags
- Color customization beyond predefined palette
- Label usage analytics
- Label templates for quick creation

## Troubleshooting

### Common Issues
1. **Labels not loading**: Check backend API connectivity
2. **Color picker not working**: Ensure Material-UI is properly installed
3. **Delete button disabled**: Label is assigned to presentations
4. **Form submission errors**: Check network connectivity and API status

### Error Handling
- Network errors are displayed as user-friendly messages
- API errors show specific error details
- Loading states prevent multiple submissions
- Form validation prevents invalid submissions
