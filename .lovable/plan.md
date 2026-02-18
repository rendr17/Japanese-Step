
# Fix: Authentication State Management

## Problem
Clicking "Simpan ke Materi" shows "Login terlebih dahulu" even when logged in. The root cause: the app has no authentication context or route protection. Every page calls `supabase.auth.getUser()` independently, and without proper session management, the auth state is lost.

## Solution

### 1. Create an AuthProvider context
A new `src/contexts/AuthContext.tsx` that:
- Listens to `supabase.auth.onAuthStateChange` for session updates
- Provides `user`, `session`, and `isLoading` to the entire app
- Handles initial session loading before rendering child components

### 2. Create a ProtectedRoute component
A wrapper component that:
- Redirects unauthenticated users to `/login`
- Shows a loading spinner while auth state is being determined

### 3. Update App.tsx
- Wrap the app with `AuthProvider`
- Wrap app routes (dashboard, materials, vocabulary, AI tools) with `ProtectedRoute`
- Keep `/login`, `/register`, `/onboarding` as public routes

### 4. Update components to use auth context
Replace scattered `supabase.auth.getUser()` calls in action handlers (like `handleSaveToMaterials`) with the user from context, so auth state is always available synchronously.

---

## Technical Details

**AuthContext** will follow this pattern:

```typescript
// Listen for auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
  }
);

// Initial load
const { data: { session } } = await supabase.auth.getSession();
setSession(session);
setUser(session?.user ?? null);
setIsLoading(false);
```

**ProtectedRoute** will check auth and redirect:

```typescript
if (isLoading) return <LoadingSpinner />;
if (!user) return <Navigate to="/login" replace />;
return <Outlet />;
```

**Files to create:**
- `src/contexts/AuthContext.tsx` - Auth provider and hook

**Files to modify:**
- `src/App.tsx` - Add AuthProvider wrapper and ProtectedRoute
- `src/pages/MaterialGenerator.tsx` - Use `useAuth()` hook instead of `getUser()` call
- `src/pages/SentenceAnalyzer.tsx` - Same fix
- `src/hooks/useAiChat.ts` - Same fix
- Other hooks/pages that call `getUser()` can be updated incrementally
