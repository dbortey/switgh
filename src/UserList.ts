import { apiService } from './api';

interface User {
  id: number;
  name: string;
  email: string;
}

export class UserList {
  private container: HTMLElement;
  private users: User[] = [];
  private loading = true;
  private error: string | null = null;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id "${containerId}" not found`);
    this.container = element;
    this.init();
  }

  private async init() {
    this.render();
    try {
      this.users = await apiService.getUsers();
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.loading = false;
      this.render();
    }
  }

  private render() {
    if (this.loading) {
      this.container.innerHTML = '<div class="p-4">Loading...</div>';
      return;
    }

    if (this.error) {
      this.container.innerHTML = `<div class="p-4 text-red-500">Error: ${this.error}</div>`;
      return;
    }

    const usersHTML = this.users.map(user => `
      <div class="p-3 bg-gray-100 rounded">
        <div class="font-semibold">${user.name}</div>
        <div class="text-sm text-gray-600">${user.email}</div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">Users</h2>
        <div class="space-y-2">
          ${usersHTML}
        </div>
      </div>
    `;
  }
}
