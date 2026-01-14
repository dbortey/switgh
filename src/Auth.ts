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
      <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 class="text-3xl font-bold text-center mb-6">Social App</h1>
          
          <div class="flex mb-6 border-b">
            <button 
              id="login-tab" 
              class="flex-1 py-2 ${this.showingLogin ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}"
            >
              Login
            </button>
            <button 
              id="register-tab" 
              class="flex-1 py-2 ${!this.showingLogin ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}"
            >
              Register
            </button>
          </div>
          
          <div id="auth-form-container"></div>
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
          <div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ${this.error}
          </div>
        ` : ''}
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input 
            type="text" 
            id="username" 
            name="username"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            name="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div class="flex items-center">
          <input 
            type="checkbox" 
            id="remember-me" 
            name="remember-me"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded"
            ${this.loading ? 'disabled' : ''}
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>
        
        <button 
          type="submit" 
          class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      // Reload page to show authenticated content
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
          <div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ${this.error}
          </div>
        ` : ''}
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input 
            type="text" 
            id="username" 
            name="username"
            required
            pattern="[a-z0-9._]{3,30}"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3-30 characters (lowercase, numbers, . or _)"
            ${this.loading ? 'disabled' : ''}
          />
          <p class="text-xs text-gray-500 mt-1">
            Lowercase letters, numbers, dots, and underscores only
          </p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input 
            type="password" 
            id="password" 
            name="password"
            required
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="At least 6 characters"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password"
            required
            minlength="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Re-enter password"
            ${this.loading ? 'disabled' : ''}
          />
        </div>
        
        <button 
          type="submit" 
          class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

    // Client-side validation
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
      // Reload page to show authenticated content
      window.location.reload();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Registration failed';
      this.loading = false;
      this.render();
    }
  }
}
