/**
 * API Endpoints & DTO Mapping Documentation
 * This file documents all API endpoints and their corresponding DTOs
 */

export const API_ENDPOINTS = {
  // ==================== AUTH ENDPOINTS ====================
  AUTH: {
    LOGIN: {
      path: '/api/auth/login',
      method: 'POST',
      requestDTO: 'LoginRequest',
      responseDTO: 'LoginResponse',
      auth: false,
      description: 'User login with email and password',
    },
    REGISTER: {
      path: '/api/auth/register',
      method: 'POST',
      requestDTO: 'RegisterRequest',
      responseDTO: 'RegisterResponse',
      auth: false,
      description: 'User registration',
    },
    LOGOUT: {
      path: '/api/auth/logout',
      method: 'POST',
      requestDTO: 'none',
      responseDTO: 'LogoutResponse',
      auth: true,
      description: 'User logout',
    },
    SESSION: {
      path: '/api/auth/session',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'SessionResponse',
      auth: true,
      description: 'Get current user session',
    },
    REFRESH: {
      path: '/api/auth/refresh',
      method: 'POST',
      requestDTO: 'RefreshTokenRequest',
      responseDTO: 'RefreshTokenResponse',
      auth: false,
      description: 'Refresh access token',
    },
    FORGOT_PASSWORD: {
      path: '/api/auth/forgot-password',
      method: 'POST',
      requestDTO: 'ForgotPasswordRequest',
      responseDTO: 'ForgotPasswordResponse',
      auth: false,
      description: 'Request password reset email',
    },
    RESET_PASSWORD: {
      path: '/api/auth/reset-password',
      method: 'POST',
      requestDTO: 'ResetPasswordRequest',
      responseDTO: 'ResetPasswordResponse',
      auth: false,
      description: 'Reset password with token',
    },
    OTP_SEND: {
      path: '/api/auth/otp/send',
      method: 'POST',
      requestDTO: 'OTPSendRequest',
      responseDTO: 'OTPSendResponse',
      auth: false,
      description: 'Send OTP to email',
    },
    OTP_VERIFY: {
      path: '/api/auth/otp/verify',
      method: 'POST',
      requestDTO: 'OTPVerifyRequest',
      responseDTO: 'OTPVerifyResponse',
      auth: false,
      description: 'Verify OTP code',
    },
    TOTP_SETUP: {
      path: '/api/auth/totp/setup',
      method: 'POST',
      requestDTO: 'TOTPSetupRequest',
      responseDTO: 'TOTPSetupResponse',
      auth: true,
      description: 'Setup 2FA with TOTP',
    },
    TOTP_ENABLE: {
      path: '/api/auth/totp/enable',
      method: 'POST',
      requestDTO: 'TOTPEnableRequest',
      responseDTO: 'TOTPEnableResponse',
      auth: true,
      description: 'Enable TOTP 2FA',
    },
    TOTP_DISABLE: {
      path: '/api/auth/totp/disable',
      method: 'POST',
      requestDTO: 'TOTPDisableRequest',
      responseDTO: 'TOTPDisableResponse',
      auth: true,
      description: 'Disable TOTP 2FA',
    },
    SSO_CALLBACK: {
      path: '/api/auth/callback/[provider]',
      method: 'GET',
      requestDTO: 'SSOCallbackRequest',
      responseDTO: 'SSOCallbackResponse',
      auth: false,
      description: 'SSO provider callback',
    },
    SSO_LOGIN: {
      path: '/api/auth/sso/[provider]',
      method: 'GET',
      requestDTO: 'SSOProviderRequest',
      responseDTO: 'SSOCallbackResponse',
      auth: false,
      description: 'SSO login redirect',
    },
  },

  // ==================== USER ENDPOINTS ====================
  USERS: {
    GET_ALL: {
      path: '/api/users',
      method: 'GET',
      requestDTO: 'GetUsersRequest (query params)',
      responseDTO: 'UserListResponse',
      auth: true,
      requiredRole: 'USER',
      description: 'Get all users with pagination',
    },
    GET_BY_ID: {
      path: '/api/users/[userId]',
      method: 'GET',
      requestDTO: 'GetUserByIdRequest (path param)',
      responseDTO: 'UserResponse',
      auth: true,
      description: 'Get user by ID',
    },
    ME: {
      path: '/api/users/me',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'UserPrivateResponse',
      auth: true,
      description: 'Get current user profile',
    },
    UPDATE_PROFILE: {
      path: '/api/auth/me/profile',
      method: 'PUT',
      requestDTO: 'UpdateProfileRequest',
      responseDTO: 'UpdateProfileResponse',
      auth: true,
      description: 'Update user profile',
    },
    GET_PREFERENCES: {
      path: '/api/auth/me/preferences',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'GetPreferencesResponse',
      auth: true,
      description: 'Get user preferences',
    },
    UPDATE_PREFERENCES: {
      path: '/api/auth/me/preferences',
      method: 'PUT',
      requestDTO: 'UpdatePreferencesRequest',
      responseDTO: 'UpdatePreferencesResponse',
      auth: true,
      description: 'Update user preferences',
    },
    GET_SECURITY: {
      path: '/api/auth/me/security',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'GetSecuritySettingsResponse',
      auth: true,
      description: 'Get user security settings',
    },
  },

  // ==================== CONTENT ENDPOINTS ====================
  POSTS: {
    GET_ALL: {
      path: '/api/posts',
      method: 'GET',
      requestDTO: 'GetPostsRequest (query params)',
      responseDTO: 'PostListResponse',
      auth: false,
      description: 'Get all posts with filtering',
    },
    CREATE: {
      path: '/api/posts',
      method: 'POST',
      requestDTO: 'CreatePostRequest',
      responseDTO: 'PostResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Create new post',
    },
    UPDATE: {
      path: '/api/posts',
      method: 'PUT',
      requestDTO: 'UpdatePostRequest',
      responseDTO: 'PostResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Update post',
    },
    GET_BY_ID: {
      path: '/api/posts/[postId]',
      method: 'GET',
      requestDTO: 'postId (path param)',
      responseDTO: 'PostResponse',
      auth: false,
      description: 'Get post by ID',
    },
    LIKE: {
      path: '/api/posts/[postId]/like',
      method: 'POST',
      requestDTO: 'postId (path param)',
      responseDTO: 'generic response',
      auth: false,
      description: 'Like a post',
    },
    LIKE_COUNT: {
      path: '/api/posts/[postId]/like/count',
      method: 'GET',
      requestDTO: 'postId (path param)',
      responseDTO: 'like count',
      auth: false,
      description: 'Get post like count',
    },
  },

  // ==================== COMMENT ENDPOINTS ====================
  COMMENTS: {
    GET_ALL: {
      path: '/api/comments',
      method: 'GET',
      requestDTO: 'GetCommentsRequest (query params)',
      responseDTO: 'CommentListResponse',
      auth: false,
      description: 'Get comments for a post',
    },
    CREATE: {
      path: '/api/comments',
      method: 'POST',
      requestDTO: 'CreateCommentRequest',
      responseDTO: 'CreateCommentResponse',
      auth: true,
      requiredRole: 'GUEST',
      description: 'Create comment on post',
    },
    GET_BY_ID: {
      path: '/api/comments/[commentId]',
      method: 'GET',
      requestDTO: 'commentId (path param)',
      responseDTO: 'CommentResponse',
      auth: false,
      description: 'Get comment by ID',
    },
    DELETE: {
      path: '/api/comments/[commentId]',
      method: 'DELETE',
      requestDTO: 'commentId (path param)',
      responseDTO: 'generic response',
      auth: true,
      description: 'Delete comment',
    },
  },

  // ==================== CATEGORY ENDPOINTS ====================
  CATEGORIES: {
    GET_ALL: {
      path: '/api/categories',
      method: 'GET',
      requestDTO: 'GetCategoriesRequest (query params)',
      responseDTO: 'CategoryListResponse',
      auth: false,
      description: 'Get all categories',
    },
    CREATE: {
      path: '/api/categories',
      method: 'POST',
      requestDTO: 'CreateCategoryRequest',
      responseDTO: 'CategoryResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Create new category',
    },
    GET_BY_ID: {
      path: '/api/categories/[categoryId]',
      method: 'GET',
      requestDTO: 'categoryId (path param)',
      responseDTO: 'CategoryResponse',
      auth: false,
      description: 'Get category by ID',
    },
    UPDATE: {
      path: '/api/categories/[categoryId]',
      method: 'PUT',
      requestDTO: 'UpdateCategoryRequest',
      responseDTO: 'CategoryResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Update category',
    },
    DELETE: {
      path: '/api/categories/[categoryId]',
      method: 'DELETE',
      requestDTO: 'categoryId (path param)',
      responseDTO: 'generic response',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Delete category',
    },
  },

  // ==================== PROJECT ENDPOINTS ====================
  PROJECTS: {
    GET_ALL: {
      path: '/api/projects',
      method: 'GET',
      requestDTO: 'GetProjectsRequest (query params)',
      responseDTO: 'ProjectListResponse',
      auth: false,
      description: 'Get all projects',
    },
    CREATE: {
      path: '/api/projects',
      method: 'POST',
      requestDTO: 'CreateProjectRequest',
      responseDTO: 'ProjectResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Create new project',
    },
    UPDATE: {
      path: '/api/projects',
      method: 'PUT',
      requestDTO: 'UpdateProjectRequest',
      responseDTO: 'ProjectResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Update project',
    },
    GET_BY_ID: {
      path: '/api/projects/[projectId]',
      method: 'GET',
      requestDTO: 'projectId (path param)',
      responseDTO: 'ProjectResponse',
      auth: false,
      description: 'Get project by ID',
    },
  },

  // ==================== APPOINTMENT ENDPOINTS ====================
  APPOINTMENTS: {
    GET_ALL: {
      path: '/api/appointments',
      method: 'GET',
      requestDTO: 'GetAppointmentsRequest (query params)',
      responseDTO: 'AppointmentListResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Get all appointments',
    },
    CREATE: {
      path: '/api/appointments',
      method: 'POST',
      requestDTO: 'CreateAppointmentRequest',
      responseDTO: 'AppointmentResponse',
      auth: true,
      description: 'Create new appointment',
    },
    BOOK: {
      path: '/api/appointments/[appointmentId]/book',
      method: 'POST',
      requestDTO: 'BookAppointmentRequest',
      responseDTO: 'AppointmentResponse',
      auth: false,
      description: 'Book an appointment',
    },
    CANCEL: {
      path: '/api/appointments/[appointmentId]/cancel',
      method: 'POST',
      requestDTO: 'CancelAppointmentRequest',
      responseDTO: 'generic response',
      auth: true,
      description: 'Cancel appointment',
    },
  },

  // ==================== SLOT ENDPOINTS ====================
  SLOTS: {
    GET_ALL: {
      path: '/api/slots',
      method: 'GET',
      requestDTO: 'GetSlotsRequest (query params)',
      responseDTO: 'SlotListResponse',
      auth: false,
      description: 'Get all available slots',
    },
    GET_BY_DATE: {
      path: '/api/slots/[date]',
      method: 'GET',
      requestDTO: 'GetSlotsByDateRequest (path param)',
      responseDTO: 'SlotListResponse',
      auth: false,
      description: 'Get slots for specific date',
    },
    CREATE: {
      path: '/api/slots',
      method: 'POST',
      requestDTO: 'CreateSlotRequest',
      responseDTO: 'SlotResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Create new slot',
    },
    UPDATE: {
      path: '/api/slots',
      method: 'PUT',
      requestDTO: 'UpdateSlotRequest',
      responseDTO: 'SlotResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Update slot',
    },
  },

  // ==================== AI ENDPOINTS ====================
  AI: {
    GPT4O: {
      path: '/api/ai/gpt-4o',
      method: 'POST',
      requestDTO: 'GPT4oRequest',
      responseDTO: 'GPT4oResponse',
      auth: true,
      description: 'Generate text with GPT-4o',
    },
    DALLE: {
      path: '/api/ai/dall-e',
      method: 'POST',
      requestDTO: 'DallERequest',
      responseDTO: 'DallEResponse',
      auth: true,
      description: 'Generate image with DALL-E',
    },
  },

  // ==================== CONTACT ENDPOINTS ====================
  CONTACT: {
    FORM: {
      path: '/api/contact/form',
      method: 'POST',
      requestDTO: 'ContactFormRequest',
      responseDTO: 'ContactFormResponse',
      auth: false,
      description: 'Submit contact form',
    },
    SUBSCRIPTION: {
      path: '/api/contact/subscription',
      method: 'POST',
      requestDTO: 'SubscriptionRequest',
      responseDTO: 'SubscriptionResponse',
      auth: false,
      description: 'Subscribe to newsletter',
    },
    UNSUBSCRIBE: {
      path: '/api/contact/subscription',
      method: 'DELETE',
      requestDTO: 'SubscriptionRequest',
      responseDTO: 'SubscriptionResponse',
      auth: false,
      description: 'Unsubscribe from newsletter',
    },
    INFO_MAIL: {
      path: '/api/contact/info/mail',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'contact info',
      auth: false,
      description: 'Get contact email',
    },
    INFO_PHONE: {
      path: '/api/contact/info/phone',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'contact info',
      auth: false,
      description: 'Get contact phone',
    },
  },

  // ==================== SETTINGS ENDPOINTS ====================
  SETTINGS: {
    GET: {
      path: '/api/settings',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'GetSettingsResponse',
      auth: false,
      description: 'Get application settings',
    },
    UPDATE: {
      path: '/api/settings',
      method: 'POST',
      requestDTO: 'UpdateSettingsRequest',
      responseDTO: 'UpdateSettingsResponse',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Update settings',
    },
  },

  // ==================== STORAGE ENDPOINTS ====================
  AWS: {
    UPLOAD: {
      path: '/api/aws',
      method: 'POST',
      requestDTO: 'AWSUploadRequest (multipart/form-data)',
      responseDTO: 'AWSUploadResponse',
      auth: true,
      description: 'Upload file to S3',
    },
    UPLOAD_FROM_URL: {
      path: '/api/aws/from-url',
      method: 'POST',
      requestDTO: 'url and folder',
      responseDTO: 'AWSUploadResponse',
      auth: true,
      description: 'Upload file to S3 from URL',
    },
  },

  // ==================== SEARCH ENDPOINTS ====================
  SEARCH: {
    GET: {
      path: '/api/search',
      method: 'GET',
      requestDTO: 'SearchRequest (query params)',
      responseDTO: 'SearchResponse',
      auth: false,
      description: 'Search posts and projects',
    },
  },

  // ==================== UTILITY ENDPOINTS ====================
  UTILITY: {
    STATUS: {
      path: '/api/status',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'status object',
      auth: false,
      description: 'Get API status',
    },
    ANALYTICS_GEO: {
      path: '/api/analytics/geo',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'geo analytics',
      auth: false,
      description: 'Get geographic analytics',
    },
    KNOWLEDGE_GRAPH: {
      path: '/api/knowledge-graph',
      method: 'GET',
      requestDTO: 'none',
      responseDTO: 'knowledge graph data',
      auth: false,
      description: 'Get knowledge graph',
    },
    KNOWLEDGE_GRAPH_REBUILD: {
      path: '/api/knowledge-graph/rebuild',
      method: 'POST',
      requestDTO: 'none',
      responseDTO: 'success message',
      auth: true,
      requiredRole: 'ADMIN',
      description: 'Rebuild knowledge graph',
    },
  },
};

/**
 * Summary of API Endpoints
 * Total: 56 endpoints
 * 
 * Categories:
 * - Auth: 12 endpoints
 * - Users: 7 endpoints
 * - Posts: 5 endpoints
 * - Comments: 4 endpoints
 * - Categories: 5 endpoints
 * - Projects: 4 endpoints
 * - Appointments: 4 endpoints
 * - Slots: 4 endpoints
 * - AI: 2 endpoints
 * - Contact: 5 endpoints
 * - Settings: 2 endpoints
 * - AWS: 2 endpoints
 * - Search: 1 endpoint
 * - Utility: 4 endpoints
 */
