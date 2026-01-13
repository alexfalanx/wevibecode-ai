# WeVibeCode.ai - API Documentation

## Overview
This document provides comprehensive API documentation for WeVibeCode.ai's internal API routes and utilities.

## API Routes

### Website Generation API

#### POST `/api/generate-website`

Generates a complete website using AI based on user specifications.

**Authentication**: Required

**Request Body**:
```typescript
{
  prompt: string;                    // User's website description
  websiteType: string;              // Type of website (restaurant, landing, etc.)
  sections: string[];               // Selected sections to include
  vibe: string;                     // Design vibe (professional, fun, luxury, etc.)
  colorMode: 'custom' | 'ai';      // Color selection mode
  colorPalette?: {                  // Required if colorMode is 'custom'
    primary: string;                // Hex color code
    secondary: string;              // Hex color code
  };
  customLogo: boolean;              // Whether to generate a custom logo
  logoColorMode?: 'custom' | 'ai';  // Logo color selection mode
  logoColorPalette?: {              // Required if logoColorMode is 'custom'
    primary: string;
    secondary: string;
  };
  includeImages: boolean;           // Whether to include professional images
}
```

**Response**:
```typescript
{
  success: boolean;
  previewId: string;                // ID to view the generated website
  creditsUsed: number;              // Credits deducted from user account
}
```

**Errors**:
- `401 Unauthorized`: User not authenticated
- `402 Payment Required`: Insufficient credits
- `500 Internal Server Error`: AI generation failed

**Cost**: 1-7 credits depending on options selected
- Base website: 1 credit
- Professional images: +3 credits
- Custom logo: +3 credits

---

### Preview API

#### GET `/api/preview/[id]`

Retrieves the generated HTML content for a preview.

**Authentication**: Required (RLS enforced)

**Parameters**:
- `id` (path parameter): UUID of the preview

**Response**:
Returns HTML document with:
- Embedded CSS
- Embedded JavaScript
- Responsive design
- Optimized for iframe rendering

**Headers**:
- `Content-Type: text/html; charset=utf-8`
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src * data:; font-src *;`

**Errors**:
- `404 Not Found`: Preview doesn't exist or user doesn't have access
- `500 Internal Server Error`: Database error

---

### Image Generation API

#### POST `/api/generate-image`

Generates AI images using DALL-E (if implemented).

**Authentication**: Required

**Request Body**:
```typescript
{
  prompt: string;                   // Image description
  size?: '256x256' | '512x512' | '1024x1024';
  style?: 'vivid' | 'natural';
}
```

**Response**:
```typescript
{
  success: boolean;
  imageUrl: string;                 // URL to generated image
  creditsUsed: number;
}
```

---

## Utility Functions

### Analytics (`lib/analytics.ts`)

#### `trackEvent(eventName: string, eventData?: Record<string, any>)`
Tracks user events for analytics purposes.

**Parameters**:
- `eventName`: Name of the event (e.g., 'website_generated')
- `eventData`: Additional data about the event

**Example**:
```typescript
trackEvent('button_clicked', { button_id: 'generate', page: 'dashboard' });
```

---

#### `logError(error: Error | string, context?: Record<string, any>)`
Logs errors to the database for monitoring.

**Parameters**:
- `error`: Error object or error message string
- `context`: Additional context about where the error occurred

**Example**:
```typescript
try {
  await riskyOperation();
} catch (error) {
  logError(error, { action: 'risky_operation', userId: '123' });
}
```

---

#### `trackPageView(pageName: string)`
Tracks when a user views a page.

**Example**:
```typescript
useEffect(() => {
  trackPageView('generate');
}, []);
```

---

#### `trackGeneration(websiteType: string, creditsUsed: number)`
Tracks successful website generation.

---

#### `trackPreviewView(previewId: string)`
Tracks when a user views a preview.

---

### Toast Notifications (`components/Toast.tsx`)

#### `useToast()` Hook

Returns toast notification methods:

```typescript
const toast = useToast();

// Success notification
toast.success('Operation completed!', 5000); // duration in ms

// Error notification
toast.error('Something went wrong!', 7000);

// Warning notification
toast.warning('Please check your input');

// Info notification
toast.info('Generation started...');
```

**Auto-dismiss**: Default 5000ms (5 seconds)

---

### Confirmation Dialog (`components/ConfirmDialog.tsx`)

#### `<ConfirmDialog />` Component

Reusable confirmation dialog with keyboard support.

**Props**:
```typescript
{
  isOpen: boolean;                  // Controls visibility
  onClose: () => void;              // Called when dialog is closed
  onConfirm: () => void;            // Called when user confirms
  title: string;                    // Dialog title
  message: string;                  // Dialog message
  confirmText?: string;             // Confirm button text (default: "Confirm")
  cancelText?: string;              // Cancel button text (default: "Cancel")
  confirmButtonClass?: string;      // Custom styling for confirm button
  icon?: React.ReactNode;           // Custom icon
}
```

**Keyboard Shortcuts**:
- `Escape`: Close dialog
- `Enter`: Confirm action (when focused)

**Example**:
```typescript
<ConfirmDialog
  isOpen={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  onConfirm={handleDelete}
  title="Delete Website"
  message="Are you sure you want to delete this website?"
  confirmText="Delete"
  confirmButtonClass="bg-red-600 hover:bg-red-700"
/>
```

---

### Loading Skeletons (`components/LoadingSkeleton.tsx`)

Pre-built loading skeleton components for better UX:

- `<DashboardSkeleton />` - Dashboard loading state
- `<GeneratePageSkeleton />` - Generate page loading state
- `<PreviewSkeleton />` - Preview loading state
- `<ListSkeleton count={number} />` - List loading state
- `<CardSkeleton />` - Card loading state

---

## Database Tables

### `analytics_events`
Stores user event tracking data.

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `event_name` (VARCHAR)
- `event_data` (JSONB)
- `created_at` (TIMESTAMPTZ)

**RLS**: Users can only insert and view their own events

---

### `error_logs`
Stores application errors for monitoring.

**Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, nullable)
- `error_message` (TEXT)
- `error_stack` (TEXT)
- `context` (JSONB)
- `user_agent` (TEXT)
- `created_at` (TIMESTAMPTZ)

**RLS**: Anyone can insert, users can view their own logs

---

## Performance Optimizations

### Caching Strategy

**Preview API**:
- Cache duration: 1 hour (3600 seconds)
- Stale-while-revalidate: 24 hours
- ETag-based validation

**Database Queries**:
- Indexed columns for faster lookups
- RLS policies optimized for performance

### Lazy Loading

**Preview Component**:
- Iframe content loaded on-demand
- Loading skeleton displayed during fetch
- Error boundaries for graceful failure

---

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled to ensure users can only access their own data.

### Content Security Policy (CSP)
Preview iframe has strict CSP to prevent XSS attacks:
- Allows inline styles and scripts (required for generated content)
- Restricts external resources
- `X-Frame-Options: SAMEORIGIN` prevents clickjacking

### Authentication
All API routes verify user authentication via Supabase Auth.

---

## Error Handling

### Standard Error Response
```typescript
{
  error: string;                    // Error message
  details?: any;                    // Additional error details
}
```

### Error Logging
All errors are automatically logged to the `error_logs` table with:
- Error message
- Stack trace
- User context
- Timestamp
- User agent

---

## Keyboard Shortcuts

### Global
- `Escape`: Close dialogs and exit fullscreen

### Preview Page
- `Cmd/Ctrl + R`: Refresh preview
- `Escape`: Exit fullscreen mode

### Dialogs
- `Escape`: Close dialog
- `Enter`: Confirm action (when button focused)

---

## Rate Limiting

**Status**: Not currently implemented

**Recommendation**: Implement rate limiting for:
- Website generation: 10 requests per minute
- Image generation: 5 requests per minute
- Preview views: 60 requests per minute

---

## Monitoring & Analytics

### Tracked Events
- `page_view`: User views a page
- `website_generated`: User generates a website
- `preview_viewed`: User views a preview
- `user_action`: Generic user action

### Error Monitoring
All errors are logged with context for debugging and monitoring.

### Metrics to Track
- Generation success rate
- Average generation time
- Credits used per user
- Most popular website types
- Error frequency and types

---

## Future Improvements

1. **API Versioning**: Implement `/api/v1/` versioning
2. **Rate Limiting**: Add request throttling
3. **Webhooks**: Allow external integrations
4. **Export API**: Download generated websites as ZIP
5. **Template API**: Save and reuse templates
6. **Collaboration API**: Share previews with team members

---

## Support

For questions or issues with the API:
- Check error logs in Supabase dashboard
- Review analytics for usage patterns
- Contact development team for assistance
