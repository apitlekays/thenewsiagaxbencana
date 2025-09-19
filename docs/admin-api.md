# Admin API Endpoints Documentation

**Last updated: 2025-01-19**

This document describes the server-side admin API endpoints that replace client-side mutations for improved security and data integrity.

## Overview

The admin API endpoints provide secure, server-side operations for managing vessels, incidents, and users. All endpoints require proper authentication and authorization.

## Authentication

All admin endpoints require:
- Valid JWT token in the `Authorization` header
- User must have appropriate role (admin/editor/viewer)

```bash
Authorization: Bearer <jwt_token>
```

## Endpoints

### Vessels Management

#### `GET /api/admin/vessels`
**Description**: List all vessels with admin details  
**Auth Required**: Admin  
**Response**: 
```json
{
  "vessels": [
    {
      "id": 1,
      "gsf_id": 123,
      "name": "Vessel Name",
      "status": "active",
      "latitude": 35.0,
      "longitude": 20.0,
      "timestamp_utc": "2025-01-19T10:00:00Z",
      // ... other vessel fields
    }
  ]
}
```

#### `PUT /api/admin/vessels`
**Description**: Update vessel status  
**Auth Required**: Admin  
**Request Body**:
```json
{
  "vesselId": 1,
  "status": "active" | "decommissioned"
}
```
**Response**:
```json
{
  "vessel": {
    "id": 1,
    "status": "active",
    "updated_at": "2025-01-19T10:00:00Z"
  }
}
```

#### `PATCH /api/admin/vessels`
**Description**: Update vessel information  
**Auth Required**: Admin  
**Request Body**:
```json
{
  "vesselId": 1,
  "updates": {
    "name": "New Name",
    "type": "cargo",
    "image_url": "https://example.com/image.jpg",
    "origin": "barcelona"
  }
}
```

#### `DELETE /api/admin/vessels`
**Description**: Delete old vessel positions  
**Auth Required**: Admin  
**Request Body**:
```json
{
  "vesselId": 1,
  "olderThan": "2025-01-01T00:00:00Z"
}
```

### Incidents Management

#### `GET /api/admin/incidents`
**Description**: List all incidents  
**Auth Required**: Admin or Editor  
**Response**:
```json
{
  "incidents": [
    {
      "id": 1,
      "timestamp_utc": "2025-01-19T10:00:00Z",
      "title": "Incident Title",
      "description": "Incident description",
      "severity": "high",
      "category": "collision",
      "location": "Mediterranean Sea",
      "source_url": "https://example.com/source",
      "created_by": "user-uuid",
      "created_at": "2025-01-19T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/incidents`
**Description**: Create new incident  
**Auth Required**: Admin or Editor  
**Request Body**:
```json
{
  "timestamp_utc": "2025-01-19T10:00:00Z",
  "title": "Incident Title",
  "description": "Incident description",
  "severity": "low" | "medium" | "high" | "critical",
  "category": "collision",
  "location": "Mediterranean Sea",
  "source_url": "https://example.com/source"
}
```

#### `PUT /api/admin/incidents`
**Description**: Update incident  
**Auth Required**: Admin or Editor  
**Request Body**:
```json
{
  "id": 1,
  "title": "Updated Title",
  "severity": "high"
  // ... other fields to update
}
```

#### `DELETE /api/admin/incidents?id={incidentId}`
**Description**: Delete incident  
**Auth Required**: Admin or Editor  
**Query Parameters**: `id` - Incident ID to delete

### User Management

#### `GET /api/admin/users`
**Description**: List all users with roles  
**Auth Required**: Admin  
**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "user_id": "user-uuid",
      "role": "admin",
      "created_at": "2025-01-19T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "email": "admin@example.com",
        "created_at": "2025-01-19T10:00:00Z",
        "last_sign_in_at": "2025-01-19T10:00:00Z"
      }
    }
  ]
}
```

#### `POST /api/admin/users`
**Description**: Create new user  
**Auth Required**: Admin  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "admin" | "editor" | "viewer"
}
```

#### `PUT /api/admin/users`
**Description**: Update user role  
**Auth Required**: Admin  
**Request Body**:
```json
{
  "userId": "user-uuid",
  "role": "admin" | "editor" | "viewer"
}
```

#### `DELETE /api/admin/users?userId={userId}`
**Description**: Delete user  
**Auth Required**: Admin  
**Query Parameters**: `userId` - User ID to delete

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [] // Optional: validation errors for 400 responses
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token or insufficient permissions)
- `500` - Internal Server Error

## Security Features

1. **JWT Token Validation**: All requests must include valid JWT token
2. **Role-Based Access Control**: Different endpoints require different roles
3. **Input Validation**: All inputs validated using Zod schemas
4. **Server-Side Operations**: No client-side database mutations
5. **Audit Trail**: All operations logged with timestamps and user info

## Migration from Client-Side Mutations

The following client-side patterns have been replaced:

**Before (Client-Side)**:
```typescript
const { data, error } = await supabase
  .from('vessels')
  .update({ status: 'active' })
  .eq('id', vesselId);
```

**After (Server-Side API)**:
```typescript
const response = await fetch('/api/admin/vessels', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ vesselId, status: 'active' })
});
```

## Usage in React Components

Use the provided hooks for easy integration:

```typescript
import { useAdminVessels, useVesselMutations } from '@/hooks/mutations/useAdminMutations';

function VesselManagement() {
  const { data, loading, error } = useAdminVessels();
  const { updateVesselStatus } = useVesselMutations();

  const handleStatusChange = async (vesselId: number, status: string) => {
    await updateVesselStatus.mutateAsync({ vesselId, status });
  };

  // ... component implementation
}
```

## RLS Policy Updates

The following RLS policies have been updated to prevent client-side mutations:

- **Vessels**: Public read-only access
- **Vessel Positions**: Public read-only access  
- **Incidents**: Public read-only access
- **User Roles**: Users can only read their own role

All write operations must go through the admin API endpoints with proper authentication.
