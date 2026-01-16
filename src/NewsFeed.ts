import { apiService, type Post } from './api.ts';
import { PostComponent } from './Post.ts';

export class NewsFeed {
  private container: HTMLElement;
  private posts: Post[] = [];
  private postComponents: Map<number, PostComponent> = new Map();
  private loading = false;
  private error: string | null = null;
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.init();
  }
  
  private async init() {
    await this.loadFeed();
  }
  
  private async loadFeed() {
    this.loading = true;
    this.error = null;
    this.render();
    
    try {
      this.posts = await apiService.getFeed();
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Failed to load feed:', error);
      this.error = error instanceof Error ? error.message : 'Failed to load feed';
      this.loading = false;
      this.render();
    }
  }
  
  private async handleCreatePost(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const caption = formData.get('caption') as string;
    const imageUrl = formData.get('image_url') as string;
    
    if (!caption.trim() && !imageUrl.trim()) {
      alert('Please add a caption or image URL');
      return;
    }
    
    try {
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Posting...';
      }
      
      const newPost = await apiService.createPost(caption, imageUrl || undefined);
      this.posts.unshift(newPost); // Add to beginning of feed
      form.reset();
      this.render();
      
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    }
  }
  
  private handleDeletePost(postId: number) {
    this.posts = this.posts.filter(p => p.id !== postId);
    this.postComponents.delete(postId);
    this.render();
  }
  
  private handleLikeToggle(postId: number, liked: boolean, likeCount: number) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.user_liked = liked;
      post.like_count = likeCount;
    }
    
    const postComponent = this.postComponents.get(postId);
    if (postComponent) {
      postComponent.updateLikeDisplay(liked, likeCount);
    }
  }
  
  private render() {
    if (this.loading) {
      this.container.innerHTML = `
        <div class="max-w-2xl mx-auto p-4">
          <div class="bg-white rounded-lg shadow p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading feed...</p>
          </div>
        </div>
      `;
      return;
    }
    
    if (this.error) {
      this.container.innerHTML = `
        <div class="max-w-2xl mx-auto p-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p class="text-red-600">${this.error}</p>
            <button class="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors" 
                    id="retry-btn">
              Retry
            </button>
          </div>
        </div>
      `;
      
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.loadFeed());
      }
      return;
    }
    
    const currentUser = apiService.getCurrentUser();
    
    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto p-4 space-y-4">
        <!-- Create Post Form -->
        <div class="bg-white rounded-lg shadow p-4">
          <form id="create-post-form" class="space-y-3">
            <div class="flex items-start space-x-3">
              <img src="${currentUser?.profile_pic || '/assets/default-avatar.png'}" 
                   alt="${currentUser?.username || 'User'}" 
                   class="w-10 h-10 rounded-full object-cover">
              <div class="flex-1">
                <textarea 
                  name="caption" 
                  placeholder="What's on your mind, ${currentUser?.username || 'there'}?"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <input 
                type="url" 
                name="image_url" 
                placeholder="Image URL (optional)"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
              <button 
                type="submit" 
                class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Post
              </button>
            </div>
          </form>
        </div>
        
        <!-- Posts Feed -->
        <div id="posts-container">
          ${this.posts.length === 0 ? `
            <div class="bg-white rounded-lg shadow p-8 text-center">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 class="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
              <p class="text-gray-500">Be the first to share something!</p>
            </div>
          ` : this.posts.map(post => {
            const postComponent = new PostComponent(
              post,
              (postId) => this.handleDeletePost(postId),
              (postId, liked, likeCount) => this.handleLikeToggle(postId, liked, likeCount)
            );
            this.postComponents.set(post.id, postComponent);
            return postComponent.render();
          }).join('')}
        </div>
      </div>
    `;
    
    // Attach event listeners
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
      createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
    }
    
    // Attach event listeners for each post
    this.postComponents.forEach((postComponent, postId) => {
      const postElement = this.container.querySelector(`[data-post-id="${postId}"]`);
      if (postElement) {
        postComponent.attachEventListeners(postElement as HTMLElement);
      }
    });
  }
}
