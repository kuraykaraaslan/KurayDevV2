# API Endpoints & DTOs Summary

## Quick Reference

### 🔐 Authentication Endpoints (12)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/auth/login` | POST | ❌ | LoginRequest → LoginResponse |
| `/api/auth/register` | POST | ❌ | RegisterRequest → RegisterResponse |
| `/api/auth/logout` | POST | ✅ | - → LogoutResponse |
| `/api/auth/session` | GET | ✅ | - → SessionResponse |
| `/api/auth/refresh` | POST | ❌ | RefreshTokenRequest → RefreshTokenResponse |
| `/api/auth/forgot-password` | POST | ❌ | ForgotPasswordRequest → ForgotPasswordResponse |
| `/api/auth/reset-password` | POST | ❌ | ResetPasswordRequest → ResetPasswordResponse |
| `/api/auth/otp/send` | POST | ❌ | OTPSendRequest → OTPSendResponse |
| `/api/auth/otp/verify` | POST | ❌ | OTPVerifyRequest → OTPVerifyResponse |
| `/api/auth/totp/setup` | POST | ✅ | TOTPSetupRequest → TOTPSetupResponse |
| `/api/auth/totp/enable` | POST | ✅ | TOTPEnableRequest → TOTPEnableResponse |
| `/api/auth/totp/disable` | POST | ✅ | TOTPDisableRequest → TOTPDisableResponse |

### 👤 User Management Endpoints (7)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/users` | GET | ✅ | GetUsersRequest → UserListResponse |
| `/api/users/[userId]` | GET | ✅ | - → UserResponse |
| `/api/users/me` | GET | ✅ | - → UserPrivateResponse |
| `/api/auth/me/profile` | PUT | ✅ | UpdateProfileRequest → UpdateProfileResponse |
| `/api/auth/me/preferences` | GET | ✅ | - → GetPreferencesResponse |
| `/api/auth/me/preferences` | PUT | ✅ | UpdatePreferencesRequest → UpdatePreferencesResponse |
| `/api/auth/me/security` | GET | ✅ | - → GetSecuritySettingsResponse |

### 📝 Content Endpoints
#### Posts (5 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/posts` | GET | ❌ | GetPostsRequest → PostListResponse |
| `/api/posts` | POST | ✅ | CreatePostRequest → PostResponse |
| `/api/posts` | PUT | ✅ | UpdatePostRequest → PostResponse |
| `/api/posts/[postId]` | GET | ❌ | - → PostResponse |
| `/api/posts/[postId]/like` | POST | ❌ | - → response |

#### Comments (4 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/comments` | GET | ❌ | GetCommentsRequest → CommentListResponse |
| `/api/comments` | POST | ✅ | CreateCommentRequest → CreateCommentResponse |
| `/api/comments/[commentId]` | GET | ❌ | - → CommentResponse |
| `/api/comments/[commentId]` | DELETE | ✅ | - → response |

#### Categories (5 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/categories` | GET | ❌ | GetCategoriesRequest → CategoryListResponse |
| `/api/categories` | POST | ✅ | CreateCategoryRequest → CategoryResponse |
| `/api/categories/[categoryId]` | GET | ❌ | - → CategoryResponse |
| `/api/categories/[categoryId]` | PUT | ✅ | UpdateCategoryRequest → CategoryResponse |
| `/api/categories/[categoryId]` | DELETE | ✅ | - → response |

#### Projects (4 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/projects` | GET | ❌ | GetProjectsRequest → ProjectListResponse |
| `/api/projects` | POST | ✅ | CreateProjectRequest → ProjectResponse |
| `/api/projects` | PUT | ✅ | UpdateProjectRequest → ProjectResponse |
| `/api/projects/[projectId]` | GET | ❌ | - → ProjectResponse |

### 📅 Appointment & Scheduling Endpoints
#### Appointments (4 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/appointments` | GET | ✅ | GetAppointmentsRequest → AppointmentListResponse |
| `/api/appointments` | POST | ✅ | CreateAppointmentRequest → AppointmentResponse |
| `/api/appointments/[appointmentId]/book` | POST | ❌ | BookAppointmentRequest → AppointmentResponse |
| `/api/appointments/[appointmentId]/cancel` | POST | ✅ | CancelAppointmentRequest → response |

#### Slots (4 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/slots` | GET | ❌ | GetSlotsRequest → SlotListResponse |
| `/api/slots/[date]` | GET | ❌ | GetSlotsByDateRequest → SlotListResponse |
| `/api/slots` | POST | ✅ | CreateSlotRequest → SlotResponse |
| `/api/slots` | PUT | ✅ | UpdateSlotRequest → SlotResponse |

### 🤖 AI & Services Endpoints
#### AI (2 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/ai/gpt-4o` | POST | ✅ | GPT4oRequest → GPT4oResponse |
| `/api/ai/dall-e` | POST | ✅ | DallERequest → DallEResponse |

#### Contact (5 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/contact/form` | POST | ❌ | ContactFormRequest → ContactFormResponse |
| `/api/contact/subscription` | POST | ❌ | SubscriptionRequest → SubscriptionResponse |
| `/api/contact/subscription` | DELETE | ❌ | SubscriptionRequest → SubscriptionResponse |
| `/api/contact/info/mail` | GET | ❌ | - → contact info |
| `/api/contact/info/phone` | GET | ❌ | - → contact info |

#### Settings (2 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/settings` | GET | ❌ | - → GetSettingsResponse |
| `/api/settings` | POST | ✅ | UpdateSettingsRequest → UpdateSettingsResponse |

#### Storage (2 endpoints)
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/aws` | POST | ✅ | AWSUploadRequest → AWSUploadResponse |
| `/api/aws/from-url` | POST | ✅ | - → AWSUploadResponse |

### 🔍 Search & Utility Endpoints
| Endpoint | Method | Auth | DTO |
|----------|--------|------|-----|
| `/api/search` | GET | ❌ | SearchRequest → SearchResponse |
| `/api/status` | GET | ❌ | - → status |
| `/api/analytics/geo` | GET | ❌ | - → geo data |
| `/api/knowledge-graph` | GET | ❌ | - → graph data |
| `/api/knowledge-graph/rebuild` | POST | ✅ | - → success |

## Statistics

- **Total Endpoints**: 56
- **Public (No Auth)**: 32
- **Protected (Auth Required)**: 24
- **Total DTO Files**: 9
- **Total Request/Response Types**: 100+

## DTO File Mapping

| File | Endpoints | Types |
|------|-----------|-------|
| AuthDTO.ts | 14 | 18 |
| PostDTO.ts | 5 | 5 |
| CommentDTO.ts | 4 | 5 |
| UserDTO.ts | 7 | 7 |
| CategoryDTO.ts | 5 | 6 |
| ProjectDTO.ts | 4 | 6 |
| AppointmentDTO.ts | 4 | 6 |
| SlotDTO.ts | 4 | 6 |
| AIAndServicesDTO.ts | 17 | 20 |

## Usage Examples

### Validate Request in API Route
```typescript
import { CreatePostRequestSchema, CreatePostRequest } from '@/dtos';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    const validated: CreatePostRequest = CreatePostRequestSchema.parse(body);
    // Use validated data
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}
```

### Type-Safe API Call
```typescript
import { LoginRequest, LoginResponse } from '@/dtos';

async function login(email: string, password: string): Promise<LoginResponse> {
  const request: LoginRequest = { email, password };
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  return response.json() as Promise<LoginResponse>;
}
```

### Frontend Component with DTOs
```typescript
import { CreateCommentRequest, CreateCommentResponse } from '@/dtos';

export async function submitComment(formData: CreateCommentRequest) {
  const response = await fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  
  const data: CreateCommentResponse = await response.json();
  return data;
}
```

---

**Created**: December 22, 2024  
**Status**: ✅ Complete
