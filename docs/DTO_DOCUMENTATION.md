# API DTOs Documentation

This document provides a comprehensive overview of all Data Transfer Objects (DTOs) created for the KurayDevV2 API.

## Overview

**Total API Endpoints**: 56  
**Total DTOs Created**: 8 files  
**Total Types/Schemas**: 100+

## DTO Files Created

### 1. **AuthDTO.ts** - Authentication & Authorization
- LoginRequest / LoginResponse
- RegisterRequest / RegisterResponse
- ForgotPasswordRequest / ForgotPasswordResponse
- ResetPasswordRequest / ResetPasswordResponse
- OTPSendRequest / OTPSendResponse
- OTPVerifyRequest / OTPVerifyResponse
- TOTPSetupRequest / TOTPSetupResponse
- TOTPEnableRequest / TOTPEnableResponse
- TOTPDisableRequest / TOTPDisableResponse
- SessionResponse
- LogoutResponse
- RefreshTokenRequest / RefreshTokenResponse
- SSOCallbackRequest / SSOCallbackResponse
- SSOProviderRequest
- UpdateProfileRequest / UpdateProfileResponse
- UpdatePreferencesRequest / UpdatePreferencesResponse
- GetPreferencesResponse
- GetSecuritySettingsResponse

### 2. **PostDTO.ts** - Blog Posts Management
- GetPostsRequest
- CreatePostRequest
- UpdatePostRequest
- PostResponse
- PostListResponse

### 3. **CommentDTO.ts** - Comments Management
- CreateCommentRequest
- GetCommentsRequest
- CommentResponse
- CommentListResponse
- CreateCommentResponse

### 4. **UserDTO.ts** - User Management
- GetUsersRequest
- CreateUserRequest
- UpdateUserRequest
- GetUserByIdRequest
- UserResponse
- UserListResponse
- UserPrivateResponse

### 5. **CategoryDTO.ts** - Content Categories
- GetCategoriesRequest
- CreateCategoryRequest
- UpdateCategoryRequest
- GetCategoryByIdRequest
- CategoryResponse
- CategoryListResponse

### 6. **ProjectDTO.ts** - Project Portfolio
- GetProjectsRequest
- CreateProjectRequest
- UpdateProjectRequest
- GetProjectByIdRequest
- ProjectResponse
- ProjectListResponse

### 7. **AppointmentDTO.ts** - Appointment Scheduling
- GetAppointmentsRequest
- CreateAppointmentRequest
- BookAppointmentRequest
- CancelAppointmentRequest
- AppointmentResponse
- AppointmentListResponse

### 8. **SlotDTO.ts** - Time Slots Management
- GetSlotsRequest
- GetSlotsByDateRequest
- CreateSlotRequest
- UpdateSlotRequest
- SlotResponse
- SlotListResponse

### 9. **AIAndServicesDTO.ts** - AI & Miscellaneous Services
- GPT4oRequest / GPT4oResponse
- DallERequest / DallEResponse
- ContactFormRequest / ContactFormResponse
- SubscriptionRequest / SubscriptionResponse
- GetSettingsResponse / UpdateSettingsRequest / UpdateSettingsResponse
- AWSUploadRequest / AWSUploadResponse
- SearchRequest / SearchResponse
- SearchResultItem

## API Endpoints by Category

### Authentication (12 endpoints)
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/session
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/otp/send
- POST /api/auth/otp/verify
- POST /api/auth/totp/setup
- POST /api/auth/totp/enable
- POST /api/auth/totp/disable
- GET /api/auth/callback/[provider]
- GET /api/auth/sso/[provider]

### User Management (7 endpoints)
- GET /api/users
- GET /api/users/[userId]
- GET /api/users/me
- PUT /api/auth/me/profile
- GET /api/auth/me/preferences
- PUT /api/auth/me/preferences
- GET /api/auth/me/security

### Posts (5 endpoints)
- GET /api/posts
- POST /api/posts
- PUT /api/posts
- GET /api/posts/[postId]
- POST /api/posts/[postId]/like
- GET /api/posts/[postId]/like/count

### Comments (4 endpoints)
- GET /api/comments
- POST /api/comments
- GET /api/comments/[commentId]
- DELETE /api/comments/[commentId]

### Categories (5 endpoints)
- GET /api/categories
- POST /api/categories
- GET /api/categories/[categoryId]
- PUT /api/categories/[categoryId]
- DELETE /api/categories/[categoryId]

### Projects (4 endpoints)
- GET /api/projects
- POST /api/projects
- PUT /api/projects
- GET /api/projects/[projectId]

### Appointments (4 endpoints)
- GET /api/appointments
- POST /api/appointments
- POST /api/appointments/[appointmentId]/book
- POST /api/appointments/[appointmentId]/cancel

### Slots (4 endpoints)
- GET /api/slots
- GET /api/slots/[date]
- POST /api/slots
- PUT /api/slots

### AI Services (2 endpoints)
- POST /api/ai/gpt-4o
- POST /api/ai/dall-e

### Contact Services (5 endpoints)
- POST /api/contact/form
- POST /api/contact/subscription
- DELETE /api/contact/subscription
- GET /api/contact/info/mail
- GET /api/contact/info/phone

### Settings (2 endpoints)
- GET /api/settings
- POST /api/settings

### Storage (2 endpoints)
- POST /api/aws
- POST /api/aws/from-url

### Search (1 endpoint)
- GET /api/search

### Utility (4 endpoints)
- GET /api/status
- GET /api/analytics/geo
- GET /api/knowledge-graph
- POST /api/knowledge-graph/rebuild

## Using DTOs in Your Code

### Import DTOs
```typescript
import {
  LoginRequest,
  LoginResponse,
  CreatePostRequest,
  PostResponse,
  CreateCommentRequest,
  // ... other DTOs
} from '@/dtos';
```

### Use with Request Validation
```typescript
import { LoginRequestSchema } from '@/dtos/AuthDTO';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate request
  const result = LoginRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.errors },
      { status: 400 }
    );
  }
  
  const loginData: LoginRequest = result.data;
  // ... handle login
}
```

### Use with Type Safety
```typescript
async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  return response.json() as Promise<LoginResponse>;
}
```

## Best Practices

1. **Always import DTOs from `/dtos` directory**
   ```typescript
   import { CreatePostRequest } from '@/dtos';
   ```

2. **Use schemas for runtime validation**
   ```typescript
   const validated = CreatePostRequestSchema.parse(data);
   ```

3. **Type function parameters and returns**
   ```typescript
   function createPost(data: CreatePostRequest): Promise<PostResponse>
   ```

4. **Keep DTOs in sync with API endpoints**
   - Update DTO when endpoint changes
   - Document breaking changes

5. **Use partial schemas for optional updates**
   ```typescript
   UpdatePostRequestSchema.partial()
   ```

## API Documentation

For detailed endpoint information, see [API_ENDPOINTS_MAPPING.ts](./API_ENDPOINTS_MAPPING.ts)

## File Structure

```
dtos/
├── index.ts                    # Central export file
├── AuthDTO.ts                  # Authentication
├── PostDTO.ts                  # Posts
├── CommentDTO.ts               # Comments
├── UserDTO.ts                  # Users
├── CategoryDTO.ts              # Categories
├── ProjectDTO.ts               # Projects
├── AppointmentDTO.ts           # Appointments
├── SlotDTO.ts                  # Slots
└── AIAndServicesDTO.ts         # AI & Services

docs/
└── API_ENDPOINTS_MAPPING.ts    # Complete endpoint documentation
```

## Contributing

When adding new endpoints:

1. Create or update the corresponding DTO file
2. Add request and response schemas using Zod
3. Export types for TypeScript support
4. Update `dtos/index.ts` if creating a new file
5. Update `API_ENDPOINTS_MAPPING.ts` with endpoint info
6. Update this documentation file

---

**Last Updated**: December 22, 2024  
**Status**: Complete - All 56 API endpoints have corresponding DTOs
