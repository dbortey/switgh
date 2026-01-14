# Copilot Instructions for my-hostinger-app

## Working Style Preference
**Explain first, edit second**: When troubleshooting or addressing issues, provide explanations and directions first. Allow the user to attempt fixes themselves before making code changes. Only make edits if the user explicitly asks or confirms they need help implementing.

## Project Planning
**Active project plan**: [PROJECT_PLAN.md](PROJECT_PLAN.md) contains the full development roadmap for the social media site.
- Always check PROJECT_PLAN.md before starting new features to understand context and decisions
- Update PROJECT_PLAN.md when completing tasks (check off items) or making architectural decisions
- When user asks "what's next?" or "where are we?", reference the plan's current phase and status

## Architecture Overview

This is a **hybrid TypeScript/PHP application** designed for shared hosting (Hostinger):
- **Frontend**: Vite + TypeScript + Tailwind CSS (v4)
- **Backend**: PHP REST API with PDO/MySQL
- **Build Output**: Static files in `dist/` with relative paths (`base: './'` in Vite config)

### Key Directories
- `src/` - TypeScript frontend code
- `api/` - PHP backend endpoints (served directly, not bundled)
- `dist/` - Production build output (gitignored)

## Frontend Architecture

### Component Pattern: Class-Based Components
Components are **TypeScript classes** that manage their own state and rendering. See [src/UserList.ts](src/UserList.ts):

```typescript
export class UserList {
  private container: HTMLElement;
  private users: User[] = [];
  private loading = true;
  
  constructor(containerId: string) {
    // Find container, throw if not found
    // Call this.init() to load data
  }
  
  private async init() {
    this.render();  // Show loading state
    // Fetch data via apiService
    this.render();  // Show loaded/error state
  }
  
  private render() {
    // Update this.container.innerHTML based on state
  }
}
```

**Pattern Rules**:
- Constructor takes container ID, throws if not found
- `init()` handles async data loading
- `render()` updates innerHTML based on current state (loading/error/success)
- Use Tailwind utility classes for styling

### API Layer
All backend communication goes through [src/api.ts](src/api.ts):

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users.php`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users;  // Note: unwrap 'users' property
  }
}
```

**Important**: 
- API_BASE_URL is configurable via `.env` (`VITE_API_URL`)
- PHP endpoints return wrapped responses: `{ users: [...] }` not `[...]`
- Always check `response.ok` before parsing JSON

## Backend Architecture

### PHP API Pattern
Each endpoint file follows this structure (see [api/users.php](api/users.php)):

1. **Security guard**: `define('API_ACCESS', true);` at top
2. **Include dependencies**: `require_once 'db.php';`
3. **Get DB connection**: `$database = new Database(); $db = $database->getConnection();`
4. **Switch on REQUEST_METHOD**: Handle GET/POST/PUT/DELETE
5. **Use helper**: `sendJSON($data, $status)` for all responses

### Database Singleton Pattern
[api/db.php](api/db.php) provides:
- `Database` class with constructor that creates PDO connection
- `sendJSON()` helper that sets CORS headers and returns JSON
- OPTIONS preflight handling built into `sendJSON()`

**Configuration**: Update [api/config.php](api/config.php) with actual credentials before deployment.

### Security Conventions
- **No direct access**: [api/config.php](api/config.php) checks for `API_ACCESS` constant
- **Prepared statements**: Always use `$db->prepare()` with bound parameters
- **CORS**: Controlled via `ALLOWED_ORIGIN` constant (set to `*` in dev, specific domain in prod)

## Development Workflows

### Local Development
```bash
npm run dev          # Start Vite dev server (default: http://localhost:5173)
```

**PHP Development**: Since this uses PHP backend, you have two options for local API testing:
1. **Mock data**: Test frontend without PHP (API calls will fail gracefully)
2. **Local PHP server**: Install PHP locally and run separate server for `api/` folder
   - Note: VS Code PHP validation errors are expected if PHP isn't installed locally
   - The PHP code is meant to run on Hostinger's servers, not locally

### Production Build
```bash
npm run build        # Compiles TS, outputs to dist/ with relative paths
npm run preview      # Preview production build locally
```

**Deployment to Hostinger**:
1. Run `npm run build`
2. Upload `dist/` contents to public_html root
3. Upload `api/` folder to public_html/api
4. Update [api/config.php](api/config.php) with database credentials

### TypeScript Configuration
Strict mode enabled with these linting rules:
- `noUnusedLocals`, `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- Non-null assertions (`!`) are acceptable when element existence is guaranteed (e.g., `document.querySelector<HTMLDivElement>('#app')!`)

## Styling Conventions

**Tailwind v4** is configured. Use utility classes directly in template strings:
- Spacing: `p-4`, `space-y-2`, `mb-4`
- Colors: `bg-gray-100`, `text-red-500`, `text-gray-600`
- Typography: `text-2xl font-bold`, `text-sm`
- Layout: `rounded`, `font-semibold`

See [src/UserList.ts](src/UserList.ts) for inline styling examples.

## Common Pitfalls

1. **API Response Structure**: PHP endpoints return `{ users: [...] }`, not `[...]` directly
2. **Vite Base Path**: Always use `base: './'` for shared hosting compatibility
3. **PHP Security**: Never forget `define('API_ACCESS', true);` at top of API files
4. **DB Error Handling**: Catch `PDOException` and use `sendJSON()` for error responses
5. **TypeScript Imports**: Use `.ts` extension in imports (e.g., `import { setupCounter } from './counter.ts'`)
