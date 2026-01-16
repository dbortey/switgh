import { apiService, type Post as PostType } from './api.ts';

export class PostComponent {
  private post: PostType;
  private onDelete?: (postId: number) => void;
  private onLikeToggle?: (postId: number, liked: boolean, likeCount: number) => void;
  
  constructor(
    post: PostType, 
    onDelete?: (postId: number) => void,
    onLikeToggle?: (postId: number, liked: boolean, likeCount: number) => void
  ) {
    this.post = post;
    this.onDelete = onDelete;
    this.onLikeToggle = onLikeToggle;
  }
  
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
  
  private async handleLike() {
    try {
      const result = await apiService.toggleLike(this.post.id);
      this.post.user_liked = result.liked;
      this.post.like_count = result.like_count;
      
      if (this.onLikeToggle) {
        this.onLikeToggle(this.post.id, result.liked, result.like_count);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert(error instanceof Error ? error.message : 'Failed to like post');
    }
  }
  
  private async handleDelete() {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await apiService.deletePost(this.post.id);
      
      if (this.onDelete) {
        this.onDelete(this.post.id);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    }
  }
  
  render(): string {
    const currentUser = apiService.getCurrentUser();
    const isOwnPost = currentUser && currentUser.id === this.post.user_id;
    
    return `
      <div class="bg-white rounded-lg shadow mb-4" data-post-id="${this.post.id}">
        <!-- Post Header -->
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img src="${this.post.profile_pic}" alt="${this.post.username}" 
                 class="w-10 h-10 rounded-full object-cover">
            <div>
              <div class="font-semibold text-gray-900">${this.post.username}</div>
              <div class="text-xs text-gray-500">${this.formatDate(this.post.created_at)}</div>
            </div>
          </div>
          ${isOwnPost ? `
            <button class="text-gray-400 hover:text-red-600 transition-colors delete-btn" 
                    data-post-id="${this.post.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          ` : ''}
        </div>
        
        <!-- Post Caption -->
        ${this.post.caption ? `
          <div class="px-4 pb-3">
            <p class="text-gray-800 whitespace-pre-wrap">${this.escapeHtml(this.post.caption)}</p>
          </div>
        ` : ''}
        
        <!-- Post Image/Video -->
        ${this.post.image_url ? `
          <img src="${this.post.image_url}" alt="Post image" 
               class="w-full object-cover max-h-96">
        ` : ''}
        ${this.post.video_url ? `
          <video src="${this.post.video_url}" controls 
                 class="w-full max-h-96">
          </video>
        ` : ''}
        
        <!-- Post Actions -->
        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center space-x-6">
            <button class="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors like-btn ${this.post.user_liked ? 'text-primary' : ''}" 
                    data-post-id="${this.post.id}">
              <svg class="w-6 h-6 ${this.post.user_liked ? 'fill-current' : ''}" fill="${this.post.user_liked ? 'currentColor' : 'none'}" 
                   stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span class="like-count">${this.post.like_count}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  attachEventListeners(container: HTMLElement) {
    const likeBtn = container.querySelector(`.like-btn[data-post-id="${this.post.id}"]`);
    const deleteBtn = container.querySelector(`.delete-btn[data-post-id="${this.post.id}"]`);
    
    if (likeBtn) {
      likeBtn.addEventListener('click', () => this.handleLike());
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.handleDelete());
    }
  }
  
  updateLikeDisplay(liked: boolean, likeCount: number) {
    this.post.user_liked = liked;
    this.post.like_count = likeCount;
    
    const postElement = document.querySelector(`[data-post-id="${this.post.id}"]`);
    if (postElement) {
      const likeBtn = postElement.querySelector('.like-btn');
      const likeCountSpan = postElement.querySelector('.like-count');
      const heartIcon = postElement.querySelector('.like-btn svg');
      
      if (likeBtn) {
        if (liked) {
          likeBtn.classList.add('text-primary');
        } else {
          likeBtn.classList.remove('text-primary');
        }
      }
      
      if (heartIcon) {
        if (liked) {
          heartIcon.classList.add('fill-current');
          heartIcon.setAttribute('fill', 'currentColor');
        } else {
          heartIcon.classList.remove('fill-current');
          heartIcon.setAttribute('fill', 'none');
        }
      }
      
      if (likeCountSpan) {
        likeCountSpan.textContent = likeCount.toString();
      }
    }
  }
}
