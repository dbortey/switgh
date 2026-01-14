# Project Plan: Social Media Site (Old-School Facebook Clone)

**Status**: Phase 1 - In Progress  
**Last Updated**: January 14, 2026

## Project Overview
Building a simple social media platform with user authentication, posts (image/video), comments, likes, and user profiles.

### Features
- **Authentication**: Create account (username/password with "remember me"), login/logout
- **Feed**: View posts with images/videos, timestamps, creators, captions - with like and comment options
- **Create Post**: Upload image/video with caption
- **Profile**: View profile picture, name, online status, and user's posts

### Technical Decisions
- Store uploaded media: Hostinger's file system
- Password security: PHP's `password_hash()` and `password_verify()`
- Google OAuth: Deferred to later phase
- Session expiration: "Remember me" option (30 days vs 24 hours)
- Username rules: Follow Facebook/Instagram/TikTok guidelines (3-30 chars, alphanumeric + dots/underscores)
- Password requirements: Simple (minimum 6 characters)
- Default avatars: Placeholder image initially

---

## Phase 1: Database & Authentication Foundation

**Status**: 🔄 In Progress

### 1.1 Database Schema
**File**: `database/schema.sql`

Tables to create:
- **users**: id, username (unique), password_hash, profile_pic (nullable), online_status (boolean), created_at
- **sessions**: session_id (primary), user_id (foreign), expires_at, remember_me (boolean), created_at
- **posts**: id, user_id (foreign), image_url, video_url (nullable), caption, created_at
- **comments**: id, post_id (foreign), user_id (foreign), content, created_at
- **likes**: post_id (foreign), user_id (foreign) - composite primary key

Username validation rules:
- Unique, lowercase only
- 3-30 characters
- Alphanumeric, dots, underscores allowed
- Cannot start/end with dot
- No consecutive dots

Password requirements:
- Minimum 6 characters
- No special character requirements

### 1.2 Authentication API
**File**: `api/auth.php`

Endpoints:
- `POST /api/auth.php?action=register` - Create account
- `POST /api/auth.php?action=login` - Authenticate user (with "remember me")
- `POST /api/auth.php?action=logout` - End session
- `GET /api/auth.php?action=check` - Validate current session

### 1.3 Session Helpers
**File**: `api/db.php` (add to existing)

New helper functions:
- `startSession($user_id, $remember_me = false)` - Create session record, set cookie
- `validateSession()` - Check cookie, verify database record, return user_id or false
- `destroySession()` - Delete session from database, clear cookie
- `updateOnlineStatus($user_id, $status)` - Set user online/offline

### 1.4 Frontend API Service
**File**: `src/api.ts` (expand existing)

New methods for register, login, logout, checkSession, getCurrentUser

### 1.5 Auth Components
**File**: `src/Auth.ts` (new)

Classes: LoginForm, RegisterForm, AuthManager
Pattern: Follow UserList.ts structure (constructor → init → render)

### 1.6 Main App Entry
**File**: `src/main.ts` (update)

Changes:
- On load: Call `apiService.checkSession()`
- If not authenticated: Show AuthManager component
- If authenticated: Show placeholder content (for now)

---

## Phase 2: Core Features - Posts & Feed

**Status**: ⏳ Not Started

### Features
- Posts API (get feed, create, delete)
- File upload handler for images/videos
- Feed component (display posts)
- Create post component (upload with caption)

---

## Phase 3: Social Interactions

**Status**: ⏳ Not Started

### Features
- Comments API (CRUD)
- Likes API (toggle like)
- Profile component (user info + posts)
- Simple hash-based router

---

## Phase 4: Google OAuth (Future)

**Status**: ⏳ Deferred

---

## Implementation Checklist - Phase 1

- [ ] Create `database/schema.sql` with all tables
- [ ] Run SQL in phpMyAdmin to create tables
- [ ] Create `api/auth.php` with register/login/logout/check endpoints
- [ ] Add session helpers to `api/db.php`
- [ ] Expand `src/api.ts` with auth methods
- [ ] Create `src/Auth.ts` with LoginForm and RegisterForm classes
- [ ] Update `src/main.ts` to check session and show auth UI
- [ ] Test registration flow
- [ ] Test login flow with "remember me"
- [ ] Test logout flow
- [ ] Test session persistence across page reloads
- [ ] Deploy to Hostinger and test in production
