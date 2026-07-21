# Authentication Flow

## Architecture

ZafAutos uses **Supabase Auth** for authentication with **Next.js SSR** integration via `@supabase/ssr`.

## Client Types

| Client | Location | Use Case |
|--------|----------|----------|
| Browser Client | `src/lib/supabase/client.ts` | Client components |
| Server Client | `src/lib/supabase/server.ts` | Server components, Actions, Route Handlers |
| Middleware Client | `src/lib/supabase/middleware.ts` | Session refresh in middleware |

## Auth Flow

```
1. User visits protected route
   ↓
2. middleware.ts intercepts request
   ↓
3. updateSession() refreshes Supabase JWT
   ↓
4. If user is null + protected path → redirect to /login
   ↓
5. If user exists → proceed with request
   ↓
6. Server Component / Action calls requireAuth()
   ↓
7. getSession() validates JWT server-side
   ↓
8. Returns AuthContext { userId, email, role }
```

## Roles

| Role | Hierarchy | Permissions |
|------|-----------|-------------|
| `customer` | 0 (lowest) | Own records CRUD, browse vehicles |
| `dealer` | 1 | Customer + assigned orders |
| `admin` | 2 | All CRUD on all tables |
| `super_admin` | 3 | Admin + system settings, role management |

## Usage Examples

### Server Component
```typescript
import { requireAuth } from '@/lib/auth';

export default async function ProtectedPage() {
  const auth = await requireAuth();
  // auth.userId, auth.email, auth.role guaranteed
}
```

### Server Action
```typescript
'use server';
import { requireAuth } from '@/lib/auth';

export async function myAction() {
  const auth = await requireAuth();
  // ...
}
```

### Route Handler
```typescript
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (req, context, auth) => {
  // auth is guaranteed
  return NextResponse.json({ userId: auth.userId });
});
```

### RBAC Checks
```typescript
import { hasRole, hasMinRole, requireRole } from '@/lib/auth';

// Boolean checks
if (hasRole(auth, 'admin', 'super_admin')) { ... }
if (hasMinRole(auth, 'dealer')) { ... }

// Throwing guards
requireRole(auth, 'admin'); // throws UnauthorizedError
requireMinRole(auth, 'dealer'); // throws UnauthorizedError
```

## Middleware Protection

Protected paths (auto-redirect to `/login`):
- `/admin/*`
- `/portal/*`

Configured in `src/lib/supabase/middleware.ts`.
