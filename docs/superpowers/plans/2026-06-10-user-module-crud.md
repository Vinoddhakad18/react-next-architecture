# User Module CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create (add) functionality and rework the edit form for the admin User module so it matches the backend API (`name, email, password, mobile, roleId, branchIds`), keeping delete working.

**Architecture:** Next.js App Router. The browser talks to internal Next route handlers under `apps/web/src/app/api/v1/users/**`, which proxy to the backend (`BACKEND_API_URL`) with `X-API-Key` + bearer auth and CSRF validation on mutations. A typed service layer (`userService`) calls those routes via `apiClient`. The admin page (`apps/web/src/app/admin/users/page.tsx`) renders the list plus Add/Edit/Delete modals; Role and Branch dropdowns are populated from `roleService.getActiveRoles()` and `branchService.getBranches()`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.3, Zod 4 (validation), Jest 30 + @testing-library/react (tests), pnpm.

---

## Assumptions (verify during execution)

These were not fully confirmed; the plan is defensive and each is called out at the relevant step:

1. **Create payload** (confirmed from the provided curl): `POST /api/v1/users` with `{ name, email, password, mobile, roleId, branchIds }`.
2. **Edit payload**: `PUT /api/v1/users/{id}` accepts the same field set, with `password` **omitted when left blank**. If the backend rejects this, adjust the payload builder in Task 7.
3. **Edit prefill**: the user list/detail payload exposes `roleId`, `mobile`, and `branchIds` (or snake_case equivalents). The shared `normalizeUser` (Task 2) maps them when present; if the list omits them, add a GET-detail fetch on edit (see Task 7 note).
4. **Dropdown sources**: active roles from `ROLES.ACTIVE_LIST`, branches from `BRANCHES.LIST`. Role/branch IDs are numbers.
5. **Test runner is Jest** (`pnpm --filter web test`), not Vitest. Tests live next to code in `__tests__/`.

## Scope Check

Single subsystem (User module). One plan is appropriate. Delete already works and is out of scope except for a regression check.

## File Structure

**Create:**
- `apps/web/src/lib/utils/normalizeUser.ts` — single source of truth for backend→frontend user normalization (currently duplicated inline in two routes).
- `apps/web/src/lib/utils/__tests__/normalizeUser.test.ts` — unit tests for normalization.
- `apps/web/src/lib/validation/userSchemas.ts` — Zod schemas for create/update user.
- `apps/web/src/lib/validation/__tests__/userSchemas.test.ts` — schema tests.
- `apps/web/src/services/__tests__/user.service.test.ts` — service tests (createUser/updateUser).

**Modify:**
- `apps/web/src/types/api/user.ts` — add `CreateUserRequest`, widen `UpdateUserRequest`, add optional `mobile`/`roleId`/`branchIds` to `User`.
- `apps/web/src/services/user.service.ts` — add `createUser`, retype `updateUser`.
- `apps/web/src/app/api/v1/users/route.ts` — add `POST` (create) handler; use shared `normalizeUser`.
- `apps/web/src/app/api/v1/users/[id]/route.ts` — use shared `normalizeUser`.
- `apps/web/src/app/admin/users/page.tsx` — load roles+branches; add Create modal; rework Edit modal.

## Conventions

- Commit with the repository's existing message style. Verify before the first commit:
  Run: `git -C apps/web log --oneline -5` (or repo root) and mirror the prevailing prefix style.
- After each task: `pnpm --filter web type-check` must pass and `pnpm --filter web test` must be green.

---

### Task 1: Types for create/update user

**Depends on:** none

**Files:**
- Modify: `apps/web/src/types/api/user.ts`

This is a types-only task (non-TDD). Verification is the type-check.

- [ ] **Step 1: Add `CreateUserRequest`, widen `UpdateUserRequest`, extend `User`**

Replace the `UpdateUserRequest` interface and add the new types so the file reads:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  // Optional richer fields (present when the backend returns them).
  mobile?: string;
  roleId?: number;
  branchIds?: number[];
  createdAt: string;
  updatedAt: string;
}

// ...UserListParams / UserListResponse unchanged...

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  mobile: string;
  roleId: number;
  branchIds: number[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  roleId?: number;
  branchIds?: number[];
}
```

- [ ] **Step 2: Verify the project still type-checks (expect new errors in the page/service that later tasks fix)**

Run: `pnpm --filter web type-check`
Expected: compiles, OR fails only in `users/page.tsx` and `user.service.ts` referencing the old `role`/`status` fields — those are fixed in Tasks 3 and 7. Note the failing locations; do not fix unrelated files.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/api/user.ts
git commit -m "<repo-convention>: add create/update user types"
```

---

### Task 2: Extract and extend `normalizeUser`

**Depends on:** Task 1

**Files:**
- Create: `apps/web/src/lib/utils/normalizeUser.ts`
- Create: `apps/web/src/lib/utils/__tests__/normalizeUser.test.ts`
- Modify: `apps/web/src/app/api/v1/users/route.ts`
- Modify: `apps/web/src/app/api/v1/users/[id]/route.ts`

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/utils/__tests__/normalizeUser.test.ts`:

```ts
import { normalizeUser } from '../normalizeUser';

describe('normalizeUser', () => {
  it('maps snake_case backend fields to the frontend User shape', () => {
    const result = normalizeUser({
      id: 7,
      full_name: 'Alice Smith',
      email: 'alice@example.com',
      mobile: '+1234567890',
      role_id: 1,
      role: 'admin',
      branch_ids: [1, 2, 3],
      is_active: true,
    });

    expect(result).toMatchObject({
      id: '7',
      name: 'Alice Smith',
      email: 'alice@example.com',
      mobile: '+1234567890',
      roleId: 1,
      role: 'admin',
      branchIds: [1, 2, 3],
      status: 'active',
    });
  });

  it('derives status from isActive=false and tolerates missing fields', () => {
    const result = normalizeUser({ id: 1, isActive: false });
    expect(result.status).toBe('inactive');
    expect(result.branchIds).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter web test -- normalizeUser`
Expected: FAIL — cannot find module `../normalizeUser`.

- [ ] **Step 3: Implement `normalizeUser.ts`**

```ts
import type { User } from '@/types/api/user';

/**
 * Normalize a backend user record (snake_case or camelCase) into the
 * frontend `User` shape. Single source of truth shared by the user routes.
 */
export function normalizeUser(user: any): User {
  const status =
    user?.status ??
    (typeof user?.isActive === 'boolean'
      ? user.isActive
        ? 'active'
        : 'inactive'
      : typeof user?.is_active === 'boolean'
      ? user.is_active
        ? 'active'
        : 'inactive'
      : 'active');

  const branchIds: number[] = Array.isArray(user?.branchIds)
    ? user.branchIds
    : Array.isArray(user?.branch_ids)
    ? user.branch_ids
    : [];

  return {
    id: user?.id?.toString() ?? String(user?.user_id ?? ''),
    name: user?.name ?? user?.full_name ?? user?.username ?? '',
    email: user?.email ?? '',
    role: user?.role ?? user?.user_role ?? '',
    status,
    mobile: user?.mobile ?? user?.phone ?? undefined,
    roleId: user?.roleId ?? user?.role_id ?? undefined,
    branchIds,
    createdAt: user?.createdAt || user?.created_at || new Date().toISOString(),
    updatedAt: user?.updatedAt || user?.updated_at || new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm --filter web test -- normalizeUser`
Expected: PASS.

- [ ] **Step 5: Replace the inline copies in both routes with the shared import**

In `apps/web/src/app/api/v1/users/route.ts` and `apps/web/src/app/api/v1/users/[id]/route.ts`, delete the local `function normalizeUser(...) {...}` and add at the top:

```ts
import { normalizeUser } from '@/lib/utils/normalizeUser';
```

- [ ] **Step 6: Verify type-check and full test suite**

Run: `pnpm --filter web type-check && pnpm --filter web test`
Expected: type-check passes; tests green.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/utils/normalizeUser.ts apps/web/src/lib/utils/__tests__/normalizeUser.test.ts apps/web/src/app/api/v1/users/route.ts apps/web/src/app/api/v1/users/[id]/route.ts
git commit -m "<repo-convention>: extract shared normalizeUser util"
```

---

### Task 3: `userService.createUser` + retype `updateUser`

**Depends on:** Task 1

**Files:**
- Create: `apps/web/src/services/__tests__/user.service.test.ts`
- Modify: `apps/web/src/services/user.service.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { userService } from '../user.service';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
  API_ENDPOINTS: {
    USERS: {
      LIST: '/api/v1/users',
      CREATE: '/api/v1/users',
      UPDATE: (id: string) => `/api/v1/users/${id}`,
      DELETE: (id: string) => `/api/v1/users/${id}`,
    },
  },
}));

describe('userService.createUser', () => {
  afterEach(() => jest.resetAllMocks());

  it('POSTs the create payload to the users endpoint with auth', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ success: true, data: { id: '1' }, error: null });

    const payload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'secret123',
      mobile: '+1234567890',
      roleId: 1,
      branchIds: [1, 2, 3],
    };

    await userService.createUser(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users', payload, { auth: true });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter web test -- user.service`
Expected: FAIL — `userService.createUser is not a function`.

- [ ] **Step 3: Implement `createUser` and retype `updateUser`**

In `apps/web/src/services/user.service.ts` update the import and add the method:

```ts
import type {
  User,
  UserListParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@/types/api/user';

// inside userService, alongside getUsers:
  async createUser(user: CreateUserRequest) {
    return apiClient.post<User, CreateUserRequest>(
      API_ENDPOINTS.USERS.CREATE,
      user,
      { auth: true }
    );
  },
```

`updateUser` keeps its signature `(id: string, user: UpdateUserRequest)` — now the widened `UpdateUserRequest` from Task 1.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm --filter web test -- user.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/services/user.service.ts apps/web/src/services/__tests__/user.service.test.ts
git commit -m "<repo-convention>: add userService.createUser"
```

---

### Task 4: `POST /api/v1/users` create route

**Depends on:** Task 2

**Files:**
- Modify: `apps/web/src/app/api/v1/users/route.ts`

Route-handler integration with the live backend isn't unit-tested here (no backend in CI); verification is type-check + the manual curl from the spec. (Non-TDD step.)

- [ ] **Step 1: Add CSRF + cookies imports if missing**

At the top of `route.ts`, ensure:

```ts
import { validateCsrfFromRequest, createCsrfErrorResponse } from '@/lib/utils/validateCsrf';
import { getBackendApiKey } from '@/lib/api/backendConfig';
```

(`BACKEND_API_URL`, `cookies`, `NextRequest`, `NextResponse`, and `normalizeUser` are already imported after Task 2.)

- [ ] **Step 2: Append the `POST` handler**

```ts
export async function POST(request: NextRequest) {
  try {
    const csrfValidation = await validateCsrfFromRequest(request);
    if (!csrfValidation.isValid) {
      return createCsrfErrorResponse();
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${BACKEND_API_URL}/api/v1/users`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': getBackendApiKey(),
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    } catch (fetchError) {
      console.error('[Users API POST] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to connect to backend API', error: fetchError instanceof Error ? fetchError.message : 'Network error' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create user' };
      }
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create user', error: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(normalizeUser(data?.data ?? data), { status: 201 });
  } catch (error) {
    console.error('[Users API POST] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify type-check**

Run: `pnpm --filter web type-check`
Expected: PASS.

- [ ] **Step 4: Manual smoke test against the backend**

Start the backend + `pnpm --filter web dev`, log in to obtain the `authToken`/CSRF cookies, then exercise the spec curl (replace token):

```bash
curl -X POST 'http://localhost:4200/api/v1/users' \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-Token: <from csrf-token cookie>' \
  --cookie 'authToken=<token>; csrf-token-hash=<...>; csrf-secret=<...>' \
  -d '{"name":"Alice Smith","email":"alice@example.com","password":"string","mobile":"+1234567890","roleId":1,"branchIds":[1,2,3]}'
```
Expected: `201` with a normalized user object. (A 403 means the CSRF cookies/header weren't sent — fix the request, not the code.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/v1/users/route.ts
git commit -m "<repo-convention>: add POST create handler for users"
```

---

### Task 5: Zod validation schemas

**Depends on:** Task 1

**Files:**
- Create: `apps/web/src/lib/validation/userSchemas.ts`
- Create: `apps/web/src/lib/validation/__tests__/userSchemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { createUserSchema, updateUserSchema } from '../userSchemas';

describe('createUserSchema', () => {
  it('accepts a valid create payload', () => {
    const result = createUserSchema.safeParse({
      name: 'Alice', email: 'alice@example.com', password: 'secret123',
      mobile: '+1234567890', roleId: 1, branchIds: [1, 2],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty branchIds and bad email', () => {
    const result = createUserSchema.safeParse({
      name: 'Alice', email: 'nope', password: 'secret123',
      mobile: '+1', roleId: 1, branchIds: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('allows an empty password (treated as "unchanged")', () => {
    const result = updateUserSchema.safeParse({ name: 'Alice', password: '' });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter web test -- userSchemas`
Expected: FAIL — cannot find module `../userSchemas`.

- [ ] **Step 3: Implement the schemas**

```ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().trim().min(1, 'Mobile is required'),
  roleId: z.number().int().positive('Role is required'),
  branchIds: z.array(z.number().int().positive()).min(1, 'Select at least one branch'),
});

// On edit, password is optional; an empty string means "leave unchanged".
export const updateUserSchema = createUserSchema.partial().extend({
  password: z.union([z.string().min(6, 'Password must be at least 6 characters'), z.literal('')]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm --filter web test -- userSchemas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/validation/userSchemas.ts apps/web/src/lib/validation/__tests__/userSchemas.test.ts
git commit -m "<repo-convention>: add user form validation schemas"
```

---

### Task 6: Page — load dropdown data + Add User modal

**Depends on:** Task 3, Task 5

**Files:**
- Modify: `apps/web/src/app/admin/users/page.tsx`

UI task (non-TDD); verify via type-check + dev run + manual click-through. (An optional @testing-library test is described in Step 5.)

- [ ] **Step 1: Load active roles and branches on mount**

Add imports and state, and a loader effect:

```ts
import { userService, roleService, branchService } from '@/services';
import { createUserSchema } from '@/lib/validation/userSchemas';
import type { CreateUserRequest } from '@/types/api/user';

// state
const [roleOptions, setRoleOptions] = useState<Array<{ value: number; label: string }>>([]);
const [branchOptions, setBranchOptions] = useState<Array<{ value: number; label: string }>>([]);

useEffect(() => {
  (async () => {
    const [rolesRes, branchesRes] = await Promise.all([
      roleService.getActiveRoles(),
      branchService.getBranches({ page: 1, limit: 100 }),
    ]);
    const roles: any[] = Array.isArray(rolesRes.data)
      ? rolesRes.data
      : (rolesRes.data as any)?.data ?? [];
    setRoleOptions(roles.map((r) => ({ value: r.id, label: r.name })));
    const branches = branchesRes.data?.data ?? [];
    setBranchOptions(branches.map((b) => ({ value: b.id, label: b.branchName })));
  })().catch(() => {/* non-fatal: dropdowns simply stay empty */});
}, []);
```

- [ ] **Step 2: Add create state + handlers**

```ts
const emptyCreate: CreateUserRequest = { name: '', email: '', password: '', mobile: '', roleId: 0, branchIds: [] };
const [isCreateOpen, setIsCreateOpen] = useState(false);
const [createData, setCreateData] = useState<CreateUserRequest>(emptyCreate);

const handleOpenCreate = () => { setCreateData(emptyCreate); setSubmitError(null); setIsCreateOpen(true); };
const handleCloseCreate = () => { setIsCreateOpen(false); setSubmitError(null); };

const handleSubmitCreate = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const parsed = createUserSchema.safeParse(createData);
  if (!parsed.success) {
    setSubmitError(parsed.error.issues[0]?.message ?? 'Please fix validation errors');
    return;
  }
  setIsSubmitting(true); setSubmitError(null);
  try {
    const response = await userService.createUser(parsed.data);
    if (response.success) { handleCloseCreate(); await fetchUsers(); }
    else { setSubmitError(response.error?.message || 'Failed to create user'); }
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
  } finally { setIsSubmitting(false); }
};
```

- [ ] **Step 3: Add the "Add User" button and Create modal**

Add a button in the header actions:

```tsx
<Button onClick={handleOpenCreate} variant="primary">Add User</Button>
```

Add the modal (Role uses `Select`; Branches use a native checkbox group since `Select` is single-select only):

```tsx
<Modal isOpen={isCreateOpen} onClose={handleCloseCreate} title="Add User" size="md">
  <form onSubmit={handleSubmitCreate} className="space-y-4">
    <Input label="Name" value={createData.name}
      onChange={(e) => setCreateData((p) => ({ ...p, name: e.target.value }))} />
    <Input label="Email" type="email" value={createData.email}
      onChange={(e) => setCreateData((p) => ({ ...p, email: e.target.value }))} />
    <Input label="Password" type="password" value={createData.password}
      onChange={(e) => setCreateData((p) => ({ ...p, password: e.target.value }))} />
    <Input label="Mobile" value={createData.mobile}
      onChange={(e) => setCreateData((p) => ({ ...p, mobile: e.target.value }))} />
    <Select label="Role" value={createData.roleId || ''}
      onChange={(e) => setCreateData((p) => ({ ...p, roleId: Number(e.target.value) }))}
      options={[{ value: '', label: 'Select a role' }, ...roleOptions]} />
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">Branches</legend>
      {branchOptions.map((b) => (
        <label key={b.value} className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={createData.branchIds.includes(b.value)}
            onChange={(e) => setCreateData((p) => ({
              ...p,
              branchIds: e.target.checked
                ? [...p.branchIds, b.value]
                : p.branchIds.filter((id) => id !== b.value),
            }))} />
          {b.label}
        </label>
      ))}
    </fieldset>
    {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="outline" onClick={handleCloseCreate} disabled={isSubmitting}>Cancel</Button>
      <Button type="submit" variant="primary" isLoading={isSubmitting}>Create User</Button>
    </div>
  </form>
</Modal>
```

- [ ] **Step 4: Verify type-check + dev click-through**

Run: `pnpm --filter web type-check`
Expected: PASS. Then `pnpm --filter web dev`, open `/admin/users`, click **Add User**, submit a valid form → row appears after refresh; invalid form → inline error.

- [ ] **Step 5 (optional): Add a @testing-library test for the create modal**

Create `apps/web/src/app/admin/users/__tests__/createUser.test.tsx` that mocks `@/services`, renders the page, opens the modal, fills fields, and asserts `userService.createUser` was called with the parsed payload. Follow the render pattern in `src/tests/utils/test-utils.tsx`.

Run: `pnpm --filter web test -- createUser`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/admin/users/page.tsx
git commit -m "<repo-convention>: add create-user modal to user management"
```

---

### Task 7: Page — rework Edit modal to the richer model

**Depends on:** Task 3, Task 5, Task 2

**Files:**
- Modify: `apps/web/src/app/admin/users/page.tsx`

- [ ] **Step 1: Replace the edit form model**

Change `formData` to the update shape and prefill from the row (uses the fields normalized in Task 2):

```ts
import { updateUserSchema } from '@/lib/validation/userSchemas';
import type { UpdateUserRequest } from '@/types/api/user';

const [formData, setFormData] = useState<UpdateUserRequest>({
  name: '', email: '', mobile: '', roleId: 0, branchIds: [], password: '',
});

const handleEditUser = (user: User) => {
  setEditingUser(user);
  setFormData({
    name: user.name,
    email: user.email,
    mobile: user.mobile ?? '',
    roleId: user.roleId ?? 0,
    branchIds: user.branchIds ?? [],
    password: '',
  });
  setSubmitError(null);
  setIsEditModalOpen(true);
};
```

> **Assumption 3 note:** if `user.roleId`/`user.branchIds` are empty because the list endpoint omits them, add `getUser(id)` to `userService` + a `GET` handler in `users/[id]/route.ts`, and fetch the detail inside `handleEditUser` before opening the modal.

- [ ] **Step 2: Replace edit submit to validate + build payload (omit blank password)**

```ts
const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!editingUser) return;

  const parsed = updateUserSchema.safeParse(formData);
  if (!parsed.success) {
    setSubmitError(parsed.error.issues[0]?.message ?? 'Please fix validation errors');
    return;
  }

  const { password, ...rest } = parsed.data;
  const payload: UpdateUserRequest = { ...rest, ...(password ? { password } : {}) };

  setIsSubmitting(true); setSubmitError(null);
  try {
    const response = await userService.updateUser(editingUser.id, payload);
    if (response.success) { handleCloseEditModal(); await fetchUsers(); }
    else { setSubmitError(response.error?.message || 'Failed to update user'); }
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred');
  } finally { setIsSubmitting(false); }
};
```

- [ ] **Step 3: Replace the edit modal fields**

Mirror the Create modal fields (Name, Email, Mobile, Role `Select`, Branch checkbox group) plus a `Password` input labeled "New password (leave blank to keep current)". Remove the old `role` (string) and `status` selects and the old `validateForm` helper.

- [ ] **Step 4: Verify type-check + dev click-through + delete regression**

Run: `pnpm --filter web type-check`
Expected: PASS. Then in dev: edit a user (role/branches prefilled, blank password keeps it) and confirm delete still works.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/users/page.tsx
git commit -m "<repo-convention>: rework edit-user form to role/branch model"
```

---

### Task 8: Final verification

**Depends on:** Tasks 1–7

- [ ] **Step 1: Type-check**

Run: `pnpm --filter web type-check`
Expected: exit 0, no errors.

- [ ] **Step 2: Lint**

Run: `pnpm --filter web lint`
Expected: exit 0 (pre-existing warnings only).

- [ ] **Step 3: Tests**

Run: `pnpm --filter web test`
Expected: all green.

- [ ] **Step 4: Manual end-to-end**

In dev: create → edit → delete a user; confirm list refreshes and CSRF/auth errors don't appear in the console.

---

## Self-Review

**Spec coverage:**
- Add (create) → Tasks 1, 3, 4, 5, 6.
- Edit (rework to roleId/mobile/branchIds, optional password) → Tasks 1, 2, 5, 7.
- Delete (regression only) → Task 7 Step 4, Task 8 Step 4.
- Backend create payload `{ name, email, password, mobile, roleId, branchIds }` → Task 4 + Task 5 schema + Task 6 form.

**Placeholder scan:** every code step includes concrete code and exact commands; no "TBD"/"handle errors"-style gaps.

**Type consistency:** `CreateUserRequest`/`UpdateUserRequest` (Task 1) are used identically in the service (Task 3), schemas (Task 5), and page (Tasks 6–7); `normalizeUser` returns the `User` shape extended in Task 1.

**Known risks (flagged inline):** edit payload shape and edit prefill data depend on backend behavior (Assumptions 2–3); both have a defined fallback in Task 7.
