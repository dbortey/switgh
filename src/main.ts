import './style.css'
import { apiService } from './api.ts'
import { AuthManager } from './Auth.ts'
import { NewsFeed } from './NewsFeed.ts'

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
    <div class="min-h-screen bg-background">
      <nav class="bg-primary shadow-lg sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-white">Social App</h1>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <img 
                  src="${user.profile_pic}" 
                  alt="${user.username}"
                  class="w-8 h-8 rounded-full border-2 border-white"
                />
                <span class="font-medium text-white">${user.username}</span>
                ${user.online_status ? '<span class="w-2 h-2 bg-green-400 rounded-full"></span>' : ''}
              </div>
              <button 
                id="logout-btn" 
                class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main id="feed-container"></main>
    </div>
  `;
  
  // Setup logout handler
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await apiService.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to logout. Please try again.');
    }
  });
  
  // Initialize news feed
  new NewsFeed('feed-container');
}

init();

