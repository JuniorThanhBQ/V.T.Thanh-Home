import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, BlogPostItem } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/admin_dashboard.component.html',
})
export class AdminDashboardComponent {
  private fb = inject(FormBuilder);
  public adminService = inject(AdminService);

  public readonly activeTab = signal<'dashboard' | 'blog' | 'actuator' | 'chat'>('dashboard');
  public readonly isPostModalOpen = signal<boolean>(false);
  public readonly editingPostId = signal<string | null>(null);
  public readonly deleteTarget = signal<BlogPostItem | null>(null);
  public readonly searchQuery = signal<string>('');
  public readonly chatSearchQuery = signal<string>('');

  public postForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    category: ['Architecture', [Validators.required]],
    readTime: ['5 min read', [Validators.required]],
    status: ['PUBLISHED', [Validators.required]],
    heroImage: [
      'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
      [Validators.required],
    ],
    summary: ['', [Validators.required, Validators.minLength(10)]],
  });

  public filteredPosts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.adminService.posts();
    if (!query) {
      return all;
    }
    return all.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query),
    );
  });

  public filteredChatHistory = computed(() => {
    const query = this.chatSearchQuery().toLowerCase().trim();
    const all = this.adminService.chatHistory();
    if (!query) {
      return all;
    }
    return all.filter(
      (c) =>
        c.userQuery.toLowerCase().includes(query) ||
        c.botResponse.toLowerCase().includes(query) ||
        c.model.toLowerCase().includes(query),
    );
  });

  public openCreateModal(): void {
    this.editingPostId.set(null);
    this.postForm.reset({
      title: '',
      category: 'Architecture',
      readTime: '5 min read',
      status: 'PUBLISHED',
      heroImage: 'https://res.cloudinary.com/dfolk8pz2/image/upload/v1792385538/J_17_crrpsy.png',
      summary: '',
    });
    this.isPostModalOpen.set(true);
  }

  public openEditModal(post: BlogPostItem): void {
    this.editingPostId.set(post.id);
    this.postForm.patchValue({
      title: post.title,
      category: post.category,
      readTime: post.readTime,
      status: post.status,
      heroImage: post.heroImage,
      summary: post.summary,
    });
    this.isPostModalOpen.set(true);
  }

  public closePostModal(): void {
    this.isPostModalOpen.set(false);
    this.editingPostId.set(null);
  }

  public savePost(): void {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const val = this.postForm.value;
    const editingId = this.editingPostId();

    if (editingId) {
      this.adminService.updatePost(editingId, val);
    } else {
      this.adminService.createPost(val);
    }

    this.closePostModal();
  }

  public promptDelete(post: BlogPostItem): void {
    this.deleteTarget.set(post);
  }

  public confirmDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      this.adminService.deletePost(target.id);
      this.deleteTarget.set(null);
    }
  }

  public cancelDelete(): void {
    this.deleteTarget.set(null);
  }
}
