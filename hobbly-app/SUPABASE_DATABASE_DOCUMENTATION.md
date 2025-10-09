# Supabase Database & API Technical Documentation

**Project**: Hobbly Technologies Oy
**Database**: PostgreSQL via Supabase
**API Version**: 13.0.4
**Host**: jourvbtxuyavamxvddwc.supabase.co
**Generated**: Based on OpenAPI Specification & Codebase Analysis

---

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Core Tables](#core-tables)
3. [Database Views](#database-views)
4. [REST API Reference](#rest-api-reference)
5. [Authentication System](#authentication-system)
6. [Storage System](#storage-system)
7. [Data Flow Patterns](#data-flow-patterns)
8. [TypeScript Integration](#typescript-integration)
9. [Performance & Optimization](#performance--optimization)
10. [Error Handling](#error-handling)

---

## Database Schema Overview

### Architecture
- **Database Engine**: PostgreSQL 14+ via Supabase
- **API Layer**: PostgREST (automatic REST API generation)
- **Authentication**: Supabase Auth (GoTrue)
- **Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Realtime (not currently used)

### Core Entities
The application uses 5 main tables + 1 view + 1 RPC function:

| Entity | Type | Purpose | Records |
|--------|------|---------|---------|
| `activities` | Table | Main activities/events storage | Core data |
| `user_profiles` | Table | Extended user profile information | User management |
| `categories` | Table | Activity categorization | ~10 categories |
| `tags` | Table | Activity tagging system | ~10-50 tags |
| `activity_tags` | Table | Many-to-many relationship | Junction table |
| `activities_full` | View | Joined activities with related data | Read-only |
| `search_activities` | Function | Full-text search implementation | RPC call |

---

## Core Tables

### 1. Activities Table

**Purpose**: Main storage for all activities and events in the system.

**Schema Definition**:
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  category_id UUID REFERENCES categories(id),
  location VARCHAR(255) NOT NULL,
  address TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  price NUMERIC DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  image_url TEXT,
  user_id UUID NOT NULL, -- References auth.users
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_participants INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  external_link TEXT,
  is_deleted BOOLEAN DEFAULT false,
  isApproved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Field Specifications**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✅ | auto-generated | Primary Key |
| `title` | VARCHAR(255) | ✅ | - | Activity title |
| `description` | TEXT | ✅ | - | Full description |
| `short_description` | VARCHAR(100) | ❌ | - | Card display (max 100 chars) |
| `type` | VARCHAR(50) | ✅ | - | activity/event/hobby_opportunity/club/competition |
| `category_id` | UUID | ❌ | null | Foreign key to categories |
| `location` | VARCHAR(255) | ✅ | - | Location name |
| `address` | TEXT | ❌ | null | Full address |
| `coordinates` | JSONB | ❌ | null | GPS coordinates {lat, lng} |
| `price` | NUMERIC | ❌ | 0 | Participation price |
| `currency` | VARCHAR(3) | ❌ | 'EUR' | ISO 4217 currency code |
| `image_url` | TEXT | ❌ | null | Activity image URL |
| `user_id` | UUID | ✅ | - | Creator/organizer ID |
| `start_date` | TIMESTAMPTZ | ❌ | null | Event start time |
| `end_date` | TIMESTAMPTZ | ❌ | null | Event end time |
| `max_participants` | INTEGER | ❌ | null | Maximum participants |
| `min_age` | INTEGER | ❌ | null | Minimum age requirement |
| `max_age` | INTEGER | ❌ | null | Maximum age requirement |
| `contact_email` | VARCHAR(255) | ❌ | null | Contact email |
| `contact_phone` | VARCHAR(50) | ❌ | null | Contact phone |
| `external_link` | TEXT | ❌ | null | External website/registration |
| `is_deleted` | BOOLEAN | ❌ | false | Soft deletion flag |
| `isApproved` | BOOLEAN | ❌ | false | Moderation approval |
| `created_at` | TIMESTAMPTZ | ❌ | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | ❌ | CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules**:
- Activities are soft-deleted using `is_deleted` flag
- New activities require approval (`isApproved = false` by default)
- `short_description` auto-generated from `description` if not provided (first 97 chars + "...")
- Price `0` indicates free activity
- Coordinates stored as JSONB: `{"lat": 60.1699, "lng": 24.9384}`

### 2. User Profiles Table

**Purpose**: Extended user profile information beyond basic Supabase Auth.

**Schema Definition**:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY, -- References auth.users(id)
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  organization_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user',
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  organization_address TEXT,
  organization_number TEXT,
  isApproved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Field Specifications**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | ✅ | - | Primary Key, matches auth.users.id |
| `email` | VARCHAR(255) | ✅ | - | User email address |
| `full_name` | VARCHAR(255) | ❌ | null | Full name |
| `organization_name` | VARCHAR(255) | ❌ | null | Organization (for organizers) |
| `phone` | VARCHAR(50) | ❌ | null | Phone number |
| `role` | VARCHAR(20) | ❌ | 'user' | user/organizer/admin |
| `avatar_url` | TEXT | ❌ | null | Profile photo URL |
| `bio` | TEXT | ❌ | null | User biography |
| `address` | TEXT | ❌ | null | Personal address |
| `organization_address` | TEXT | ❌ | null | Organization address |
| `organization_number` | TEXT | ❌ | null | Organization registration number |
| `isApproved` | BOOLEAN | ❌ | false | User approval status |
| `created_at` | TIMESTAMPTZ | ❌ | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | ❌ | CURRENT_TIMESTAMP | Last update timestamp |

**Business Rules**:
- Created automatically via `handle_new_user` trigger when user signs up
- Role determines access permissions:
  - `user`: Mobile app users (view approved activities)
  - `organizer`: Activity creators (manage own activities)
  - `admin`: Full system access
- New users require approval for organizer/admin roles
- Email matches `auth.users.email` for consistency

### 3. Categories Table

**Purpose**: Categorization system for activities.

**Schema Definition**:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50), -- Emoji or URL
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Predefined Categories** (from CLAUDE.md):
1. Sports and Physical Activity 🏃
2. Music and Performing Arts 🎵
3. Crafts and Art 🎨
4. Science and Technology 🔬
5. Games and Esports 🎮
6. Food and Cooking 🍳
7. Nature and Tourism 🌲
8. Culture and History 🏛️
9. Community and Volunteering 🤝
10. Children and Families 👨‍👩‍👧‍👦

### 4. Tags Table

**Purpose**: Flexible tagging system for activities.

**Schema Definition**:
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#808080', -- HEX color
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Predefined Tags** (from CLAUDE.md):
- Free, Open to All, Suitable for Beginners
- Ongoing Event, Online, Family-Friendly
- Suitable for Seniors, Suitable for Special Groups
- Equipment Provided, Registration Required

### 5. Activity Tags Table

**Purpose**: Many-to-many relationship between activities and tags.

**Schema Definition**:
```sql
CREATE TABLE activity_tags (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, tag_id)
);
```

---

## Database Views

### Activities Full View

**Purpose**: Optimized read-only view that joins activities with related data (categories, organizers, tags).

**View Definition**:
```sql
CREATE VIEW activities_full AS
SELECT
  a.*,
  c.name as category_name,
  c.icon as category_icon,
  up.full_name as organizer_name,
  up.organization_name as organizer_organization,
  up.email as organizer_email,
  COALESCE(
    (SELECT json_agg(t.name)
     FROM activity_tags at
     JOIN tags t ON at.tag_id = t.id
     WHERE at.activity_id = a.id),
    '[]'::json
  ) as tags
FROM activities a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN user_profiles up ON a.user_id = up.id;
```

**Additional Fields** (beyond activities table):

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `category_name` | VARCHAR(255) | categories.name | Category display name |
| `category_icon` | VARCHAR(50) | categories.icon | Category icon/emoji |
| `organizer_name` | VARCHAR(255) | user_profiles.full_name | Organizer full name |
| `organizer_organization` | VARCHAR(255) | user_profiles.organization_name | Organization name |
| `organizer_email` | VARCHAR(255) | user_profiles.email | Organizer email |
| `tags` | JSON | Aggregated from activity_tags + tags | Array of tag names |

**Usage Patterns**:
- **Read Operations**: Use `activities_full` for all GET requests
- **Write Operations**: Use `activities` table directly
- **Performance**: Pre-joined data eliminates N+1 queries

---

## REST API Reference

### Base Configuration
- **Base URL**: `https://jourvbtxuyavamxvddwc.supabase.co/rest/v1`
- **API Key Header**: `apikey: YOUR_SUPABASE_ANON_KEY`
- **Authorization Header**: `Authorization: Bearer YOUR_JWT_TOKEN`
- **Content-Type**: `application/json`

### PostgREST Query Operators

**Comparison Operators**:
```
eq.value          # Equal to
neq.value         # Not equal to
gt.value          # Greater than
gte.value         # Greater than or equal
lt.value          # Less than
lte.value         # Less than or equal
like.pattern      # LIKE operator (case sensitive)
ilike.pattern     # ILIKE operator (case insensitive)
```

**Pattern Matching**:
```
ilike.*pattern*   # Contains pattern (case insensitive)
ilike.pattern*    # Starts with pattern
ilike.*pattern    # Ends with pattern
```

**Boolean & Null Operators**:
```
is.null           # IS NULL
is.true           # IS TRUE
is.false          # IS FALSE
not.is.null       # IS NOT NULL
```

**Array & Range Operators**:
```
in.(val1,val2)    # IN array
cs.{array}        # Contains (for JSONB/arrays)
cd.{array}        # Contained by
ov.{array}        # Overlap
```

**Logical Operators**:
```
and=(field1.eq.val1,field2.eq.val2)  # AND condition
or=(field1.eq.val1,field2.eq.val2)   # OR condition
not.and=(...)                         # NOT AND
not.or=(...)                          # NOT OR
```

### Activities Endpoints

#### Get Activities (with filters)
```http
GET /activities_full?isApproved=eq.true&is_deleted=is.false&order=created_at.desc
```

**Common Filter Patterns**:
```http
# Search in multiple fields
GET /activities_full?or=(title.ilike.*football*,description.ilike.*football*,location.ilike.*football*)

# Price range
GET /activities_full?price=gte.0&price=lte.50

# Free activities only
GET /activities_full?price=eq.0

# Category filter
GET /activities_full?category_id=eq.550e8400-e29b-41d4-a716-446655440000

# Date range
GET /activities_full?start_date=gte.2024-01-01&end_date=lte.2024-12-31

# Role-based access (organizer sees only own)
GET /activities_full?user_id=eq.550e8400-e29b-41d4-a716-446655440000
```

**Pagination**:
```http
GET /activities_full?order=created_at.desc&limit=20&offset=0
# OR using Range header
GET /activities_full
Range: 0-19
Range-Unit: items
Prefer: count=exact
```

**Field Selection**:
```http
GET /activities_full?select=id,title,short_description,price,image_url,category_name
```

#### Create Activity
```http
POST /activities
Content-Type: application/json
Prefer: return=representation

{
  "title": "Football Training",
  "description": "Weekly football training for beginners",
  "type": "activity",
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "location": "Helsinki",
  "price": 25,
  "user_id": "current-user-id"
}
```

#### Update Activity
```http
PATCH /activities?id=eq.550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Prefer: return=representation

{
  "title": "Updated Title",
  "price": 30
}
```

#### Soft Delete Activity
```http
PATCH /activities?id=eq.550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "is_deleted": true
}
```

#### Permanent Delete Activity
```http
DELETE /activities?id=eq.550e8400-e29b-41d4-a716-446655440000
```

### User Profiles Endpoints

#### Get Users (Admin)
```http
GET /user_profiles?select=*&order=created_at.desc

# Search users
GET /user_profiles?or=(full_name.ilike.*john*,email.ilike.*john*,organization_name.ilike.*john*)

# Filter by role
GET /user_profiles?role=eq.organizer

# Filter by approval status
GET /user_profiles?isApproved=eq.false
```

#### Update User Profile
```http
PATCH /user_profiles?id=eq.550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "full_name": "John Doe",
  "organization_name": "Sports Club Helsinki",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Approve User
```http
PATCH /user_profiles?id=eq.550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "isApproved": true
}
```

### Categories & Tags Endpoints

#### Get All Categories
```http
GET /categories?order=name.asc
```

#### Get All Tags
```http
GET /tags?order=name.asc
```

#### Add Tags to Activity
```http
POST /activity_tags
Content-Type: application/json

[
  {
    "activity_id": "550e8400-e29b-41d4-a716-446655440000",
    "tag_id": "660e8400-e29b-41d4-a716-446655440001"
  },
  {
    "activity_id": "550e8400-e29b-41d4-a716-446655440000",
    "tag_id": "660e8400-e29b-41d4-a716-446655440002"
  }
]
```

#### Remove Tags from Activity
```http
DELETE /activity_tags?activity_id=eq.550e8400-e29b-41d4-a716-446655440000
```

### Search Endpoints

#### Full-Text Search
```http
POST /rpc/search_activities
Content-Type: application/json

{
  "search_query": "football Helsinki"
}
```

**Alternative GET syntax**:
```http
GET /rpc/search_activities?search_query=football%20Helsinki
```

---

## Authentication System

### Supabase Auth Integration

**Base URL**: `https://jourvbtxuyavamxvddwc.supabase.co/auth/v1`

**Headers**:
```
apikey: YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
Authorization: Bearer JWT_TOKEN (for authenticated requests)
```

### Authentication Endpoints

#### User Registration
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "data": {
    "fullName": "John Doe",
    "phone": "+358501234567",
    "organizationName": "Sports Club Helsinki",
    "role": "organizer"
  }
}
```

**Response Structure**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "abc123...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "email_confirmed_at": null,
    "user_metadata": {
      "fullName": "John Doe",
      "organizationName": "Sports Club Helsinki",
      "role": "organizer"
    },
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### User Login
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Get Current User
```http
GET /auth/v1/user
Authorization: Bearer JWT_TOKEN
```

#### Refresh Token
```http
POST /auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "abc123..."
}
```

#### Update User
```http
PUT /auth/v1/user
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "password": "newPassword123",
  "data": {
    "fullName": "John Smith"
  }
}
```

#### Logout
```http
POST /auth/v1/logout
Authorization: Bearer JWT_TOKEN
```

#### Password Reset Request
```http
POST /auth/v1/recover
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### User Roles & Permissions

**Role Hierarchy**:
```
ADMIN > ORGANIZER > USER
```

**Access Control Matrix**:

| Resource | USER | ORGANIZER | ADMIN |
|----------|------|-----------|-------|
| View approved activities | ✅ | ✅ | ✅ |
| View pending activities | ❌ | Own only | ✅ |
| Create activities | ❌ | ✅ | ✅ |
| Edit activities | ❌ | Own only | ✅ |
| Delete activities | ❌ | Own only | ✅ |
| Approve activities | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ✅ |

**Implementation in API Layer**:
```typescript
// Role-based filtering in activities API
if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
  queryParams.user_id = `eq.${currentUserId}`;
}

// Admin-only endpoints
if (currentUserRole !== UserRole.ADMIN) {
  throw new Error('Access denied: Admin privileges required');
}
```

### Token Management

**Storage Pattern**:
```typescript
// Store tokens in localStorage
localStorage.setItem('auth_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);

// Automatic token injection
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

**Token Refresh Strategy**:
```typescript
// Automatic refresh on 401
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await authClient.post('/token?grant_type=refresh_token', {
    refresh_token: refreshToken
  });

  localStorage.setItem('auth_token', response.data.access_token);
  if (response.data.refresh_token) {
    localStorage.setItem('refresh_token', response.data.refresh_token);
  }

  return response.data.access_token;
};
```

---

## Storage System

### Storage Configuration

**Base URL**: `https://jourvbtxuyavamxvddwc.supabase.co/storage/v1`

**Buckets Used**:
1. **avatars** - User profile photos
2. **activities** - Activity images

### File Upload Endpoints

#### Upload Profile Photo
```http
POST /storage/v1/object/avatars/{filename}
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{file: File}
```

#### Upload Activity Image
```http
POST /storage/v1/object/activities/{filename}
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{file: File}
```

#### Delete File
```http
DELETE /storage/v1/object/avatars/{filename}
Authorization: Bearer JWT_TOKEN
```

### File Validation Rules

**Supported Formats**:
```typescript
const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
```

**Size Limits**:
```typescript
const maxSize = 5 * 1024 * 1024; // 5MB
const minSize = 1024; // 1KB
```

**Filename Sanitization**:
```typescript
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

const generateFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalName);
  return `${timestamp}-${sanitized}`;
};
```

### Upload Implementation Patterns

**Dual Upload Strategy** (from auth.api.ts):
```typescript
// Method 1: Supabase JS Client (preferred)
const uploadWithJSClient = async (file: File): Promise<string> => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const fileName = `${Date.now()}-${sanitizeFilename(file.name)}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
};

// Method 2: REST API Fallback
const uploadWithRESTAPI = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const formData = new FormData();
  formData.append('file', file);

  const response = await storageClient.post(
    `/object/avatars/${fileName}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
};
```

### Public URL Generation

**Pattern**:
```
{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
```

**Examples**:
```
# Profile photo
https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/avatars/1703001234567-profile.jpg

# Activity image
https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/1703001234567-activity.jpg
```

### Error Handling for Storage

**Common Error Codes**:
```typescript
const handleStorageError = (error: any): string => {
  if (error.response?.status === 400) {
    if (error.response.data?.message?.includes('row-level security')) {
      return 'Storage permission denied. Contact support.';
    }
    if (error.response.data?.message?.includes('bucket')) {
      return 'Storage bucket not found.';
    }
  }

  switch (error.response?.status) {
    case 401: return 'Authentication required for file upload.';
    case 403: return 'Access denied for file upload.';
    case 409: return 'File already exists.';
    case 413: return 'File too large (max 5MB).';
    case 415: return 'File type not supported.';
    case 422: return 'Invalid file format.';
    default: return 'Upload failed. Please try again.';
  }
};
```

---

## Data Flow Patterns

### User Registration Flow

**Step-by-Step Process**:
```
1. Frontend → POST /auth/v1/signup
   ├─ Creates user in auth.users
   ├─ Stores metadata in user_metadata
   └─ Returns access_token + refresh_token

2. Database Trigger → handle_new_user()
   ├─ Automatically creates user_profiles record
   ├─ Copies id, email from auth.users
   └─ Sets default values

3. Frontend → PATCH /user_profiles
   ├─ Updates profile with form data
   ├─ Maps metadata to profile fields
   └─ Sets role and approval status

4. (Optional) Frontend → Upload profile photo
   ├─ POST /storage/v1/object/avatars/
   ├─ Updates avatar_url in user_profiles
   └─ Returns public URL
```

**Database Trigger Implementation**:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Activity Creation Flow

**Step-by-Step Process**:
```
1. Validation → Frontend validates required fields
   ├─ title, description, type, location (required)
   ├─ categoryId (optional but recommended)
   └─ File validation for image

2. Image Upload → (if image provided)
   ├─ POST /storage/v1/object/activities/
   ├─ Generate unique filename with timestamp
   ├─ Validate file type and size
   └─ Return public URL

3. Activity Creation → POST /activities
   ├─ Include image_url if uploaded
   ├─ Set user_id to current user
   ├─ Default: isApproved=false, is_deleted=false
   └─ Return created activity with generated ID

4. Tags Association → POST /activity_tags (if tags provided)
   ├─ Create junction records for each tag
   ├─ Link activity_id to tag_id
   └─ Handle duplicate prevention

5. Full Data Retrieval → GET /activities_full
   ├─ Fetch complete activity with joins
   ├─ Include category, organizer, tags
   └─ Return to frontend
```

### Activity Approval Workflow

**Moderation Process**:
```
1. Activity Creation → isApproved = false (default)

2. Admin Review → GET /activities_full?isApproved=eq.false
   ├─ Admins see pending activities
   ├─ Review content and details
   └─ Make approval decision

3. Approval Decision → PATCH /activities
   ├─ isApproved = true (approve)
   ├─ isApproved = false + review notes
   └─ Trigger notifications (future)

4. Public Visibility → GET /activities_full
   ├─ Filter: isApproved=eq.true
   ├─ Only approved activities visible to users
   └─ Organizers see own pending activities
```

### Soft Deletion & Trash Management

**Deletion Process**:
```
1. Soft Delete → PATCH /activities
   ├─ Set is_deleted = true
   ├─ Keep all data intact
   └─ Remove from public listings

2. Trash View → GET /activities_full?is_deleted=eq.true
   ├─ Admins see all deleted activities
   ├─ Organizers see own deleted activities
   └─ Restore functionality available

3. Restore → PATCH /activities
   ├─ Set is_deleted = false
   ├─ Activity returns to active state
   └─ Preserve approval status

4. Permanent Delete → DELETE /activities
   ├─ Remove from database permanently
   ├─ Delete associated image from storage
   └─ Cascade delete activity_tags
```

### Search Implementation

**Full-Text Search Function**:
```sql
CREATE OR REPLACE FUNCTION search_activities(search_query text)
RETURNS TABLE(
  -- Return same structure as activities_full view
  id uuid,
  title varchar,
  description text,
  -- ... all other fields
) AS $$
BEGIN
  RETURN QUERY
  SELECT af.*
  FROM activities_full af
  WHERE
    af.isApproved = true
    AND af.is_deleted = false
    AND (
      af.title ILIKE '%' || search_query || '%' OR
      af.description ILIKE '%' || search_query || '%' OR
      af.location ILIKE '%' || search_query || '%' OR
      af.organizer_name ILIKE '%' || search_query || '%' OR
      af.category_name ILIKE '%' || search_query || '%'
    )
  ORDER BY
    -- Relevance scoring (title matches higher)
    CASE WHEN af.title ILIKE '%' || search_query || '%' THEN 1 ELSE 2 END,
    af.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

**Usage Pattern**:
```http
POST /rpc/search_activities
{
  "search_query": "football Helsinki"
}
```

---

## TypeScript Integration

### Database to TypeScript Mappings

**Field Name Transformations**:
```typescript
const dbToTsMapping = {
  // User fields
  'full_name': 'fullName',
  'organization_name': 'organizationName',
  'organization_address': 'organizationAddress',
  'organization_number': 'organizationNumber',
  'avatar_url': 'photoUrl', // Primary field
  'avatar_url': 'profilePhotoUrl', // Duplicate for compatibility

  // Activity fields
  'short_description': 'shortDescription',
  'category_id': 'categoryId',
  'image_url': 'imageUrl',
  'user_id': 'userId',
  'start_date': 'startDate',
  'end_date': 'endDate',
  'max_participants': 'maxParticipants',
  'min_age': 'minAge',
  'max_age': 'maxAge',
  'contact_email': 'contactEmail',
  'contact_phone': 'contactPhone',
  'external_link': 'externalLink',
  'is_deleted': 'isDeleted',

  // Metadata fields
  'created_at': 'createdAt',
  'updated_at': 'updatedAt'
};
```

### Transformation Functions

**User Profile Transformation**:
```typescript
const transformUserProfile = (profile: any): User => {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    organizationName: profile.organization_name,
    fullName: profile.full_name,
    phone: profile.phone,
    address: profile.address,
    organizationAddress: profile.organization_address,
    organizationNumber: profile.organization_number,
    photoUrl: profile.avatar_url,
    profilePhotoUrl: profile.avatar_url, // Compatibility
    isApproved: profile.isApproved || false,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at)
  };
};
```

**Activity Transformation** (from activities_full view):
```typescript
const transformActivity = (activity: any): Activity => {
  return {
    // Basic fields
    id: activity.id,
    title: activity.title,
    description: activity.description,
    shortDescription: activity.short_description,
    type: activity.type,
    categoryId: activity.category_id,

    // Category object (from join)
    category: {
      id: activity.category_id,
      name: activity.category_name,
      icon: activity.category_icon,
    } as Category,

    // Location & logistics
    location: activity.location,
    address: activity.address,
    coordinates: activity.coordinates,
    price: activity.price,
    currency: activity.currency || 'EUR',
    imageUrl: activity.image_url,

    // User & organizer
    userId: activity.user_id,
    organizer: {
      id: activity.user_id,
      fullName: activity.organizer_name,
      organizationName: activity.organizer_organization,
      email: activity.organizer_email,
      photoUrl: activity.organizer_photo_url,
      role: UserRole.ORGANIZER,
      isApproved: true,
    } as User,

    // Tags (from aggregated JSON)
    tags: activity.tags || [],

    // Dates (with proper parsing)
    startDate: activity.start_date ? new Date(activity.start_date) : undefined,
    endDate: activity.end_date ? new Date(activity.end_date) : undefined,

    // Participants & age
    maxParticipants: activity.max_participants,
    minAge: activity.min_age,
    maxAge: activity.max_age,

    // Contact info
    contactEmail: activity.contact_email,
    contactPhone: activity.contact_phone,
    externalLink: activity.external_link,

    // System fields
    isDeleted: activity.is_deleted,
    isApproved: activity.isApproved || false,
    createdAt: new Date(activity.created_at),
    updatedAt: new Date(activity.updated_at)
  };
};
```

### Interface Definitions

**Core Interfaces** (matching database schema):
```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  organizationAddress?: string;
  organizationNumber?: string;
  photoUrl?: string;
  profilePhotoUrl?: string; // Compatibility field
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Activity {
  // Core fields (required in DB)
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  location: string;

  // Optional fields
  shortDescription?: string;
  categoryId?: string;
  category?: Category;
  address?: string;
  coordinates?: { lat: number; lng: number };
  price?: number;
  currency?: string;
  imageUrl?: string;

  // User relationship
  userId: string;
  organizer?: User;

  // Tags relationship
  tags?: Tag[];

  // Event timing
  startDate?: Date;
  endDate?: Date;

  // Participants
  maxParticipants?: number;
  minAge?: number;
  maxAge?: number;

  // Contact info
  contactEmail?: string;
  contactPhone?: string;
  externalLink?: string;

  // System fields
  isDeleted: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}
```

### Form Data Interfaces

**Activity Form Data** (for creation/editing):
```typescript
interface ActivityFormData {
  title: string;
  description: string;
  shortDescription?: string;
  type: ActivityType;
  categoryId?: string;
  location: string;
  address?: string;
  price?: number;
  currency?: string;
  image?: File; // For new uploads
  imageUrl?: string; // For existing images
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  minAge?: number;
  maxAge?: number;
  contactEmail?: string;
  contactPhone?: string;
  externalLink?: string;
  tags?: string[]; // Array of tag IDs
}
```

**User Registration Form Data**:
```typescript
interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  organizationName?: string;
  organizationAddress?: string;
  organizationNumber?: string;
  photo?: File;
  agreeToTerms: boolean;
}
```

---

## Performance & Optimization

### Query Optimization Strategies

**Use activities_full View for Reads**:
```typescript
// ✅ Efficient - single query with joins
const getActivities = async () => {
  const response = await apiClient.get('/activities_full?select=*');
  return response.data.map(transformActivity);
};

// ❌ Inefficient - N+1 queries
const getActivitiesInefficient = async () => {
  const activities = await apiClient.get('/activities');

  for (const activity of activities.data) {
    activity.category = await apiClient.get(`/categories?id=eq.${activity.category_id}`);
    activity.organizer = await apiClient.get(`/user_profiles?id=eq.${activity.user_id}`);
    activity.tags = await apiClient.get(`/activity_tags?activity_id=eq.${activity.id}`);
  }

  return activities.data;
};
```

**Efficient Filtering Patterns**:
```typescript
// ✅ Database-level filtering
const getApprovedActivities = async () => {
  return apiClient.get('/activities_full?isApproved=eq.true&is_deleted=is.false');
};

// ❌ Client-side filtering (inefficient)
const getApprovedActivitiesInefficient = async () => {
  const all = await apiClient.get('/activities_full');
  return all.data.filter(a => a.isApproved && !a.is_deleted);
};
```

### Pagination Implementation

**Range-Based Pagination** (PostgREST standard):
```typescript
const buildPaginationConfig = (page: number, limit: number): AxiosRequestConfig => {
  const offset = (page - 1) * limit;

  return {
    headers: {
      'Range': `${offset}-${offset + limit - 1}`,
      'Range-Unit': 'items',
      'Prefer': 'count=exact' // Get total count
    }
  };
};

// Usage
const getActivitiesPage = async (page: number = 1, limit: number = 20) => {
  const config = buildPaginationConfig(page, limit);
  const response = await apiClient.get('/activities_full', config);

  // Parse total from Content-Range header
  const contentRange = response.headers['content-range'];
  const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

  return {
    data: response.data.map(transformActivity),
    pagination: { page, limit, total },
    total
  };
};
```

**Infinite Scroll Pattern**:
```typescript
const useInfiniteActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await getActivitiesPage(page, 20);

      setActivities(prev => [...prev, ...response.data]);
      setPage(prev => prev + 1);
      setHasMore(response.data.length === 20);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, hasMore, loadMore };
};
```

### Caching Strategies

**Response Caching**:
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
};

// Usage
const getCategories = () => getCachedData('categories', () =>
  apiClient.get('/categories').then(r => r.data)
);
```

**Image Optimization**:
```typescript
// Use WebP format when possible
const getOptimizedImageUrl = (url: string, width?: number): string => {
  if (!url) return '';

  // For Supabase Storage, add transformation parameters
  const baseUrl = url.split('?')[0];
  const params = new URLSearchParams();

  if (width) params.set('width', width.toString());
  params.set('quality', '80');
  params.set('format', 'webp');

  return `${baseUrl}?${params.toString()}`;
};
```

### Database Index Recommendations

**Recommended Indexes** (for database admin):
```sql
-- Activities table indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_category_id ON activities(category_id);
CREATE INDEX idx_activities_approved_deleted ON activities(isApproved, is_deleted);
CREATE INDEX idx_activities_location ON activities USING gin(to_tsvector('english', location));
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_activities_search ON activities USING gin(
  to_tsvector('english', title || ' ' || description || ' ' || location)
);

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_approved ON user_profiles(isApproved);

-- Activity tags indexes
CREATE INDEX idx_activity_tags_activity_id ON activity_tags(activity_id);
CREATE INDEX idx_activity_tags_tag_id ON activity_tags(tag_id);
```

---

## Error Handling

### API Error Response Format

**Standard Error Structure**:
```typescript
interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}
```

### Common HTTP Status Codes

| Status | Code | Description | Common Causes |
|--------|------|-------------|---------------|
| 200 | OK | Success | Successful GET, PATCH |
| 201 | Created | Resource created | Successful POST |
| 204 | No Content | Success, no response body | Successful DELETE |
| 206 | Partial Content | Paginated response | GET with Range header |
| 400 | Bad Request | Invalid request | Malformed JSON, invalid parameters |
| 401 | Unauthorized | Authentication required | Missing/expired token |
| 403 | Forbidden | Access denied | Insufficient permissions |
| 404 | Not Found | Resource not found | Invalid ID, deleted resource |
| 409 | Conflict | Resource conflict | Duplicate entry, constraint violation |
| 422 | Unprocessable Entity | Validation error | Invalid data format |
| 500 | Internal Server Error | Server error | Database issues, server bugs |

### Error Handling Implementation

**Axios Interceptor** (from config.ts):
```typescript
const errorInterceptor = (error: AxiosError): Promise<ApiError> => {
  const apiError: ApiError = {
    code: error.code || 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    status: error.response?.status
  };

  if (error.response) {
    const responseData = error.response.data as any;
    const serverMessage = responseData?.message || responseData?.error_description;

    switch (error.response.status) {
      case 400:
        apiError.message = serverMessage || 'Invalid request data.';
        apiError.code = 'BAD_REQUEST';
        break;

      case 401:
        apiError.message = 'Authentication required. Please sign in.';
        apiError.code = 'UNAUTHORIZED';
        removeAuthToken(); // Auto-cleanup
        break;

      case 403:
        apiError.message = 'Access denied. Insufficient permissions.';
        apiError.code = 'FORBIDDEN';
        break;

      case 404:
        apiError.message = 'Resource not found.';
        apiError.code = 'NOT_FOUND';
        break;

      case 409:
        apiError.message = serverMessage || 'Resource conflict. Duplicate entry.';
        apiError.code = 'CONFLICT';
        break;

      case 422:
        apiError.message = serverMessage || 'Validation error. Invalid data.';
        apiError.code = 'VALIDATION_ERROR';
        break;

      case 500:
        apiError.message = 'Server error. Please try again later.';
        apiError.code = 'SERVER_ERROR';
        break;
    }
  } else if (error.request) {
    apiError.message = 'Network error. Check your connection.';
    apiError.code = 'NETWORK_ERROR';
  }

  return Promise.reject(apiError);
};
```

### Validation Error Patterns

**PostgREST Validation Errors**:
```json
{
  "code": "PGRST116",
  "details": "Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row",
  "hint": null,
  "message": "JSON object requested, multiple (or no) rows returned"
}
```

**Database Constraint Errors**:
```json
{
  "code": "23505",
  "details": "Key (email)=(user@example.com) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint \"user_profiles_email_key\""
}
```

### Frontend Error Handling

**Component Error Boundaries**:
```typescript
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      setError(new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <p>{error?.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
```

**API Error Handling Hook**:
```typescript
const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = (error: any) => {
    if (error.response) {
      setError({
        code: error.code || 'API_ERROR',
        message: error.message || 'An error occurred',
        status: error.status
      });
    } else {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed'
      });
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

---

## Conclusion

This documentation provides comprehensive technical reference for the Supabase database and API integration in the Hobbly application. It covers all aspects of database schema, REST API usage, authentication, storage, and performance optimization based on the actual OpenAPI specification and codebase implementation.

**Key Integration Points**:
- ✅ Complete database schema with all fields and constraints
- ✅ REST API endpoints with PostgREST operators
- ✅ Authentication system with JWT tokens and role-based access
- ✅ Storage system for profile photos and activity images
- ✅ TypeScript mappings and transformation functions
- ✅ Performance optimization strategies
- ✅ Comprehensive error handling patterns

**For Development Reference**:
- Always consult this documentation when working with database queries
- Use the provided TypeScript interfaces for type safety
- Follow the established patterns for API calls and error handling
- Refer to the transformation functions for data mapping between database and application layers

**Maintenance Notes**:
- Update this documentation when database schema changes
- Keep TypeScript interfaces in sync with database fields
- Monitor API performance and adjust caching strategies as needed
- Review error handling patterns for new edge cases