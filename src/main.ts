import './style.css'
import { apiService } from './api.ts'
import { AuthManager } from './Auth.ts'

const app = document.querySelector<HTMLDivElement>('#app')!;

// Check authentication on load
async function init() {
  app.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="text-xl">Loading...</div></div>';
  
  const user = await apiService.checkSession();
  
  if (!user) {
    // Show auth UI
    new AuthManager('app');
  } else {
    // Show authenticated content
    showAuthenticatedApp(user);
  }
}

function showAuthenticatedApp(user: any) {
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow-md p-4">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
          <h1 class="text-2xl font-bold text-blue-600">Social App</h1>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <img 
                src="${user.profile_pic}" 
                alt="${user.username}"
                class="w-8 h-8 rounded-full"
              />
              <span class="font-medium">${user.username}</span>
              ${user.online_status ? '<span class="text-green-500 text-xs">● Online</span>' : ''}
            </div>
            <button 
              id="logout-btn" 
              class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div class="max-w-6xl mx-auto mt-8 p-4">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4">Welcome, ${user.username}!</h2>
          <p class="text-gray-600">
            Phase 1 (Authentication) is complete! Next phase will add posts, feed, and social features.
          </p>
        </div>
      </div>
    </div>
  `;
  
  // Setup logout handler
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await apiService.logout();
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  });
}

init();

