import { apiService } from './api.ts';

export class AuthManager {
  private container: HTMLElement;
  private showingLogin = true;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id "${containerId}" not found`);
    this.container = element;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold tracking-tight">Social App</h1>
          </div>
          
          <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full mb-6">
              <button 
                id="login-tab" 
                class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none flex-1 ${this.showingLogin ? 'bg-background text-foreground shadow-sm' : ''}"
              >
                Login
              </button>
              <button 
                id="register-tab" 
                class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none flex-1 ${!this.showingLogin ? 'bg-background text-foreground shadow-sm' : ''}"
              >
                Register Now
              </button>
            </div>
            
            <div id="auth-form-container"></div>
          </div>
        </div>
      </div>
    `;

    // Setup tab switching
    document.getElementById('login-tab')?.addEventListener('click', () => {
      this.showingLogin = true;
      this.render();
    });

    document.getElementById('register-tab')?.addEventListener('click', () => {
      this.showingLogin = false;
      this.render();
    });

    // Render appropriate form
    const formContainer = document.getElementById('auth-form-container');
    if (formContainer) {
      if (this.showingLogin) {
        new LoginForm(formContainer);
      } else {
        new RegisterForm(formContainer);
      }
    }
  }
}

class LoginForm {
  private container: HTMLElement;
  private loading = false;
  private error: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <form id="login-form" class="space-y-4">
        ${this.error ? `
          <div class="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
            ${this.error}
          </div>
        ` : ''}
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Username
          </label>
          <input 
            type="text" 
            id="username" 
            name="username"
            required
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter username"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            name="password"
            required
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter password"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div class="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="remember-me" 
            name="remember-me"
            class="h-4 w-4 rounded border-input"
            ${this.loading ? 'disabled' : ''}
          />
          <label for="remember-me" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Remember me
          </label>
        </div>
        
        <button 
          type="submit" 
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          ${this.loading ? 'disabled' : ''}
        >
          ${this.loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    `;

    const form = document.getElementById('login-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const rememberMe = (form.elements.namedItem('remember-me') as HTMLInputElement).checked;

    this.error = null;
    this.loading = true;
    this.render();

    try {
      await apiService.login(username, password, rememberMe);
      window.location.reload();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Login failed';
      this.loading = false;
      this.render();
    }
  }
}

class RegisterForm {
  private container: HTMLElement;
  private loading = false;
  private error: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <form id="register-form" class="space-y-4">
        ${this.error ? `
          <div class="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
            ${this.error}
          </div>
        ` : ''}
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Username
          </label>
          <input 
            type="text" 
            id="username" 
            name="username"
            required
            pattern="[a-z0-9._]{3,30}"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="3-30 characters (lowercase, numbers, . or _)"
            ${this.loading ? 'disabled' : ''}
          />
          <p class="text-xs text-muted-foreground">
            Lowercase letters, numbers, dots, and underscores only
          </p>
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            name="password"
            required
            minlength="6"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="At least 6 characters"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Confirm Password
          </label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password"
            required
            minlength="6"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Re-enter password"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <button 
          type="submit" 
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          ${this.loading ? 'disabled' : ''}
        >
          ${this.loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    `;

    const form = document.getElementById('register-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirm-password') as HTMLInputElement).value;

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match';
      this.render();
      return;
    }

    if (!/^[a-z0-9._]{3,30}$/.test(username)) {
      this.error = 'Invalid username format';
      this.render();
      return;
    }

    if (username.includes('..')) {
      this.error = 'Username cannot contain consecutive dots';
      this.render();
      return;
    }

    if (username[0] === '.' || username[username.length - 1] === '.') {
      this.error = 'Username cannot start or end with a dot';
      this.render();
      return;
    }

    this.error = null;
    this.loading = true;
    this.render();

    try {
      await apiService.register(username, password);
      window.location.reload();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Registration failed';
      this.loading = false;
      this.render();
    }
  }
}
