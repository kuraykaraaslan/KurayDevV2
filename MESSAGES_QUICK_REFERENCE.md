# 🚀 DTO Mesajları - Hızlı Referans

## İçindekiler
- [PostMessages](#postmessages)
- [CommentMessages](#commentmessages)
- [UserMessages](#usermessages)
- [CategoryMessages](#categorymessages)
- [ProjectMessages](#projectmessages)
- [AppointmentMessages](#appointmentmessages)
- [SlotMessages](#slotmessages)
- [AIMessages](#aimessages)
- [ContactMessages](#contactmessages)
- [ValidationMessages](#validationmessages)

---

## PostMessages

```typescript
import PostMessages from '@/messages/PostMessages';

enum PostMessages {
    TITLE_REQUIRED,
    CONTENT_REQUIRED,
    SLUG_REQUIRED,
    CATEGORY_REQUIRED,
    AUTHOR_REQUIRED,
    INVALID_STATUS,
    POST_NOT_FOUND,
    POST_CREATED_SUCCESSFULLY,
    POST_UPDATED_SUCCESSFULLY,
    POST_DELETED_SUCCESSFULLY,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_CATEGORY_ID,
    INVALID_AUTHOR_ID,
    INVALID_POST_ID,
    DUPLICATE_SLUG,
    SEO_TITLE_TOO_LONG,
    SEO_DESCRIPTION_TOO_LONG,
}
```

### Kullanım
```typescript
z.string().min(1, PostMessages.TITLE_REQUIRED)
z.string().min(1, PostMessages.CONTENT_REQUIRED)
z.string().min(1, PostMessages.SLUG_REQUIRED)
```

---

## CommentMessages

```typescript
import CommentMessages from '@/messages/CommentMessages';

enum CommentMessages {
    CONTENT_REQUIRED,
    POST_ID_REQUIRED,
    EMAIL_REQUIRED,
    NAME_REQUIRED,
    INVALID_EMAIL,
    POST_NOT_FOUND,
    COMMENT_NOT_FOUND,
    COMMENT_CREATED_SUCCESSFULLY,
    COMMENT_UPDATED_SUCCESSFULLY,
    COMMENT_DELETED_SUCCESSFULLY,
    COMMENT_SPAM_DETECTED,
    COMMENT_MODERATION_PENDING,
    INVALID_COMMENT_STATUS,
    CONTENT_TOO_SHORT,
    CONTENT_TOO_LONG,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    COMMENT_ALREADY_DELETED,
    UNAUTHORIZED_DELETE,
}
```

### Kullanım
```typescript
z.string().min(1, CommentMessages.CONTENT_REQUIRED)
z.string().email(CommentMessages.INVALID_EMAIL)
z.string().min(1, CommentMessages.NAME_REQUIRED)
```

---

## UserMessages

```typescript
import UserMessages from '@/messages/UserMessages';

enum UserMessages {
    EMAIL_REQUIRED,
    PASSWORD_REQUIRED,
    NAME_REQUIRED,
    INVALID_EMAIL,
    INVALID_PASSWORD,
    PASSWORD_TOO_SHORT,
    USER_NOT_FOUND,
    USER_CREATED_SUCCESSFULLY,
    USER_UPDATED_SUCCESSFULLY,
    USER_DELETED_SUCCESSFULLY,
    EMAIL_ALREADY_EXISTS,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_USER_ID,
    INVALID_ROLE,
    UNAUTHORIZED_ACCESS,
    PHONE_INVALID,
    IMAGE_URL_INVALID,
    USER_PROFILE_UPDATED,
    PREFERENCES_UPDATED,
    INVALID_PREFERENCES,
}
```

### Kullanım
```typescript
z.string().email(UserMessages.INVALID_EMAIL)
z.string().min(8, UserMessages.PASSWORD_TOO_SHORT)
z.string().min(1, UserMessages.NAME_REQUIRED)
```

---

## CategoryMessages

```typescript
import CategoryMessages from '@/messages/CategoryMessages';

enum CategoryMessages {
    TITLE_REQUIRED,
    SLUG_REQUIRED,
    CATEGORY_NOT_FOUND,
    CATEGORY_CREATED_SUCCESSFULLY,
    CATEGORY_UPDATED_SUCCESSFULLY,
    CATEGORY_DELETED_SUCCESSFULLY,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_CATEGORY_ID,
    DUPLICATE_SLUG,
    DUPLICATE_TITLE,
    TITLE_TOO_SHORT,
    TITLE_TOO_LONG,
    DESCRIPTION_TOO_LONG,
    INVALID_IMAGE_URL,
    CATEGORY_IN_USE,
    CANNOT_DELETE_CATEGORY,
}
```

### Kullanım
```typescript
z.string().min(1, CategoryMessages.TITLE_REQUIRED)
z.string().min(1, CategoryMessages.SLUG_REQUIRED)
```

---

## ProjectMessages

```typescript
import ProjectMessages from '@/messages/ProjectMessages';

enum ProjectMessages {
    TITLE_REQUIRED,
    SLUG_REQUIRED,
    PROJECT_NOT_FOUND,
    PROJECT_CREATED_SUCCESSFULLY,
    PROJECT_UPDATED_SUCCESSFULLY,
    PROJECT_DELETED_SUCCESSFULLY,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_PROJECT_ID,
    DUPLICATE_SLUG,
    INVALID_STATUS,
    INVALID_IMAGE_URL,
    INVALID_LINK_URL,
    TITLE_TOO_SHORT,
    TITLE_TOO_LONG,
    DESCRIPTION_TOO_LONG,
    CONTENT_TOO_LONG,
    INVALID_TECHNOLOGIES,
    TAGS_LIMIT_EXCEEDED,
}
```

### Kullanım
```typescript
z.string().min(1, ProjectMessages.TITLE_REQUIRED)
z.string().min(1, ProjectMessages.SLUG_REQUIRED)
z.string().url(ProjectMessages.INVALID_LINK_URL)
```

---

## AppointmentMessages

```typescript
import AppointmentMessages from '@/messages/AppointmentMessages';

enum AppointmentMessages {
    TITLE_REQUIRED,
    START_TIME_REQUIRED,
    END_TIME_REQUIRED,
    EMAIL_REQUIRED,
    NAME_REQUIRED,
    INVALID_EMAIL,
    INVALID_STATUS,
    APPOINTMENT_NOT_FOUND,
    APPOINTMENT_CREATED_SUCCESSFULLY,
    APPOINTMENT_UPDATED_SUCCESSFULLY,
    APPOINTMENT_DELETED_SUCCESSFULLY,
    APPOINTMENT_BOOKED_SUCCESSFULLY,
    APPOINTMENT_CANCELLED_SUCCESSFULLY,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_APPOINTMENT_ID,
    INVALID_DATE_RANGE,
    START_TIME_AFTER_END_TIME,
    APPOINTMENT_ALREADY_CANCELLED,
    APPOINTMENT_TIME_PASSED,
    INVALID_PHONE_NUMBER,
}
```

### Kullanım
```typescript
z.string().min(1, AppointmentMessages.TITLE_REQUIRED)
z.string().email(AppointmentMessages.INVALID_EMAIL)
```

---

## SlotMessages

```typescript
import SlotMessages from '@/messages/SlotMessages';

enum SlotMessages {
    DATE_REQUIRED,
    START_TIME_REQUIRED,
    END_TIME_REQUIRED,
    SLOT_NOT_FOUND,
    SLOT_CREATED_SUCCESSFULLY,
    SLOT_UPDATED_SUCCESSFULLY,
    SLOT_DELETED_SUCCESSFULLY,
    INVALID_PAGE_NUMBER,
    INVALID_PAGE_SIZE,
    INVALID_SLOT_ID,
    INVALID_DATE_RANGE,
    INVALID_DATE_FORMAT,
    START_TIME_AFTER_END_TIME,
    SLOT_ALREADY_BOOKED,
    SLOT_UNAVAILABLE,
    INVALID_TIME_FORMAT,
    DUPLICATE_SLOT,
    PAST_DATE,
}
```

### Kullanım
```typescript
z.string().min(1, SlotMessages.DATE_REQUIRED)
z.string().min(1, SlotMessages.START_TIME_REQUIRED)
```

---

## AIMessages

```typescript
import AIMessages from '@/messages/AIMessages';

enum AIMessages {
    PROMPT_REQUIRED,
    PROMPT_TOO_SHORT,
    PROMPT_TOO_LONG,
    INVALID_MODEL,
    GENERATION_FAILED,
    RATE_LIMIT_EXCEEDED,
    INVALID_TEMPERATURE,
    INVALID_MAX_TOKENS,
    IMAGE_GENERATION_FAILED,
    INVALID_IMAGE_SIZE,
    INVALID_IMAGE_COUNT,
    API_ERROR,
    INSUFFICIENT_CREDITS,
    MODEL_NOT_AVAILABLE,
}
```

### Kullanım
```typescript
z.string().min(1, AIMessages.PROMPT_REQUIRED)
z.enum(['256x256', '512x512', '1024x1024']).catch(AIMessages.INVALID_IMAGE_SIZE)
```

---

## ContactMessages

```typescript
import ContactMessages from '@/messages/ContactMessages';

enum ContactMessages {
    NAME_REQUIRED,
    EMAIL_REQUIRED,
    PHONE_REQUIRED,
    MESSAGE_REQUIRED,
    INVALID_EMAIL,
    INVALID_PHONE,
    MESSAGE_TOO_SHORT,
    MESSAGE_TOO_LONG,
    FORM_SUBMITTED_SUCCESSFULLY,
    FORM_SUBMISSION_FAILED,
    RATE_LIMIT_EXCEEDED,
    SUBSCRIBED_SUCCESSFULLY,
    UNSUBSCRIBED_SUCCESSFULLY,
    SUBSCRIPTION_FAILED,
    ALREADY_SUBSCRIBED,
    NOT_SUBSCRIBED,
    INVALID_EMAIL_ADDRESS,
}
```

### Kullanım
```typescript
z.string().min(1, ContactMessages.NAME_REQUIRED)
z.string().email(ContactMessages.INVALID_EMAIL)
z.string().min(1, ContactMessages.PHONE_REQUIRED)
```

---

## ValidationMessages

```typescript
import ValidationMessages from '@/messages/ValidationMessages';

enum ValidationMessages {
    FIELD_REQUIRED,
    INVALID_FORMAT,
    INVALID_LENGTH,
    INVALID_TYPE,
    INVALID_ENUM,
    INVALID_URL,
    INVALID_EMAIL,
    INVALID_PHONE,
    INVALID_DATE,
    INVALID_TIME,
    INVALID_NUMBER,
    MIN_LENGTH_NOT_MET,
    MAX_LENGTH_EXCEEDED,
    PATTERN_MISMATCH,
    ARRAY_EMPTY,
    ARRAY_TOO_LARGE,
    OBJECT_INVALID,
}
```

### Kullanım
```typescript
z.string().min(1, ValidationMessages.FIELD_REQUIRED)
z.string().url(ValidationMessages.INVALID_URL)
z.string().email(ValidationMessages.INVALID_EMAIL)
```

---

## AuthMessages

```typescript
import AuthMessages from '@/messages/AuthMessages';

// Detaylı liste için: /messages/AuthMessages.ts
// En sık kullanılanlar:

INVALID_EMAIL_ADDRESS,
INVALID_PASSWORD,
INVALID_TOKEN,
LOGIN_SUCCESSFUL,
REGISTRATION_SUCCESSFUL,
PASSWORD_RESET_SUCCESSFUL,
INVALID_OTP,
RATE_LIMIT_EXCEEDED,
```

---

## 🎯 En Sık Kullanılanlar

```typescript
// Doğrulama
PostMessages.TITLE_REQUIRED
PostMessages.CONTENT_REQUIRED
CommentMessages.CONTENT_REQUIRED
UserMessages.INVALID_EMAIL
UserMessages.PASSWORD_TOO_SHORT
ContactMessages.INVALID_EMAIL
ContactMessages.INVALID_PHONE

// Başarı
PostMessages.POST_CREATED_SUCCESSFULLY
UserMessages.USER_UPDATED_SUCCESSFULLY
CommentMessages.COMMENT_CREATED_SUCCESSFULLY

// Hata
PostMessages.POST_NOT_FOUND
UserMessages.USER_NOT_FOUND
CommentMessages.COMMENT_NOT_FOUND
```

---

## 📝 Hızlı Notlar

1. **Her zaman enum sabiti kullan** - String yerine constant
2. **Türkçe tercüme frontend'de** - Backend enum'lar, frontend tercüme
3. **Merkezileştirilmiş yönetim** - Tüm mesajlar /messages dizininde
4. **Type-safe** - TypeScript otomatik doğrulama yapar
5. **i18n compatible** - Tercüme dosyalarında enum isimlerini kullan

---

**Son Güncelleme**: December 22, 2024  
**Status**: ✅ Complete  
**Total Constants**: 200+
