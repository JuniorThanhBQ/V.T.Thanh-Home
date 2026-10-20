import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize } from 'rxjs';
import { AdminService } from '../services/admin.service';
import {
  AdminBlog,
  AdminContact,
  AdminProject,
  AdminSection,
  AdminVisitor,
} from '../services/admin.models';

const requiredText = (control: AbstractControl) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };
const webUrl = (control: AbstractControl) => {
  if (!control.value) return null;
  try {
    const url = new URL(control.value);
    return url.protocol === 'https:' && !url.username && !url.password ? null : { url: true };
  } catch {
    return { url: true };
  }
};
interface Confirmation {
  title: string;
  label: string;
  needsReason?: boolean;
  run: () => Observable<unknown>;
  after: () => void;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../templates/admin_dashboard.component.html',
  host: { class: 'block' },
})
export class AdminDashboardComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly destroyRef = inject(DestroyRef);
  public readonly adminService = inject(AdminService);
  @ViewChild('editorDialog', { static: true }) private editorDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('confirmDialog', { static: true })
  private confirmDialog!: ElementRef<HTMLDialogElement>;
  private detailRequest?: Subscription;
  private editingId: number | null = null;
  private editingVersion?: number;
  public readonly activeTab = signal<AdminSection>('overview');
  public readonly tabs: { id: AdminSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'projects', label: 'Projects' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'visitors', label: 'Visitors' },
  ];
  public readonly search = signal('');
  public readonly editor = signal<'blogs' | 'projects' | null>(null);
  public readonly editing = signal(false);
  public readonly editorLoading = signal(false);
  public readonly editorReady = signal(false);
  public readonly busy = signal(false);
  public readonly error = signal('');
  public readonly success = signal('');
  public readonly confirmation = signal<Confirmation | null>(null);
  public readonly selectedContact = signal<AdminContact | null>(null);
  public readonly blockReason = this.fb.control('', Validators.maxLength(255));
  public readonly blogForm = this.fb.group({
    slug: [
      '',
      [requiredText, Validators.maxLength(120), Validators.pattern('[a-z0-9]+(?:-[a-z0-9]+)*')],
    ],
    title: ['', [requiredText, Validators.maxLength(160)]],
    subtitle: ['', Validators.maxLength(240)],
    description: ['', Validators.maxLength(4000)],
    category: this.fb.control<AdminBlog['category']>('TECHNICAL'),
    status: this.fb.control<AdminBlog['status']>('DRAFT'),
    bannerUrl: ['', [Validators.maxLength(500), webUrl]],
    chapters: this.fb.array([this.chapter()]),
  });
  public readonly projectForm = this.fb.group({
    slug: [
      '',
      [requiredText, Validators.maxLength(120), Validators.pattern('[a-z0-9]+(?:-[a-z0-9]+)*')],
    ],
    label: ['', Validators.maxLength(50)],
    title: ['', [requiredText, Validators.maxLength(160)]],
    subtitle: ['', Validators.maxLength(240)],
    description: ['', Validators.maxLength(4000)],
    techStack: ['', Validators.maxLength(2000)],
    githubLink: ['', [Validators.maxLength(500), webUrl]],
    websiteLink: ['', [Validators.maxLength(500), webUrl]],
    displayOrder: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(2147483647),
        Validators.pattern('^[0-9]+$'),
      ],
    ],
    published: [false],
  });
  public readonly filteredPosts = computed(() =>
    this.adminService
      .posts()
      .filter((post) => this.matches(post.title, post.slug, post.category, post.status)),
  );
  public readonly filteredProjects = computed(() =>
    this.adminService
      .projects()
      .filter((project) => this.matches(project.title, project.slug, ...project.techStack)),
  );
  public readonly filteredContacts = computed(() =>
    this.adminService
      .contacts()
      .filter((contact) =>
        this.matches(
          contact.firstName,
          contact.lastName,
          contact.subject,
          contact.email,
          contact.status,
        ),
      ),
  );

  constructor() {
    this.adminService.loadMetrics();
  }

  private chapter(title = '', content = '') {
    return this.fb.group({
      title: [title, [requiredText, Validators.maxLength(160)]],
      content: [content, requiredText],
    });
  }
  public get chapters() {
    return this.blogForm.controls.chapters;
  }
  private matches(...values: string[]): boolean {
    return values.join(' ').toLowerCase().includes(this.search().trim().toLowerCase());
  }
  public selectTab(tab: AdminSection): void {
    if (this.busy()) return;
    this.activeTab.set(tab);
    this.search.set('');
    this.error.set('');
    this.success.set('');
    this.selectedContact.set(null);
    this.refresh();
  }
  public refresh(): void {
    if (this.busy()) return;
    switch (this.activeTab()) {
      case 'overview':
        this.adminService.loadMetrics();
        break;
      case 'blogs':
        this.adminService.loadPosts();
        break;
      case 'projects':
        this.adminService.loadProjects();
        break;
      case 'contacts':
        this.adminService.loadContacts();
        break;
      case 'visitors':
        this.adminService.loadVisitors();
        break;
    }
  }
  public formatBytes(value: number | null): string {
    return value !== null && value >= 0 ? `${(value / 1048576).toFixed(1)} MiB` : 'Unavailable';
  }
  public formatUptime(value: number | null): string {
    if (value === null) return 'Unavailable';
    const minutes = Math.floor(value / 60);
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
  public openBlog(post?: AdminBlog): void {
    this.beginEditor('blogs', post?.id ?? null);
    this.chapters.clear();
    this.blogForm.reset({
      slug: '',
      title: '',
      subtitle: '',
      description: '',
      category: 'TECHNICAL',
      status: 'DRAFT',
      bannerUrl: '',
    });
    if (!post) {
      this.chapters.push(this.chapter());
      return;
    }
    this.editorLoading.set(true);
    this.detailRequest = this.adminService
      .loadPostContent(post.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.editorLoading.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.editingVersion = detail.version;
          this.editorReady.set(true);
          this.blogForm.patchValue({
            ...detail,
            subtitle: detail.subtitle ?? '',
            bannerUrl: detail.bannerUrl ?? '',
          });
          for (const chapter of [...(detail.chapters ?? [])].sort(
            (a, b) => a.chapterOrder - b.chapterOrder,
          ))
            this.chapters.push(this.chapter(chapter.title, chapter.content));
        },
        error: (error: unknown) => this.error.set(this.adminService.errorMessage(error)),
      });
  }
  public openProject(project?: AdminProject): void {
    this.beginEditor('projects', project?.id ?? null);
    this.projectForm.reset({
      slug: '',
      label: '',
      title: '',
      subtitle: '',
      description: '',
      techStack: '',
      githubLink: '',
      websiteLink: '',
      displayOrder: 0,
      published: false,
    });
    if (!project) return;
    this.editorLoading.set(true);
    this.detailRequest = this.adminService
      .loadProject(project.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.editorLoading.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.editingVersion = detail.version;
          this.editorReady.set(true);
          this.projectForm.patchValue({
            ...detail,
            label: detail.label ?? '',
            subtitle: detail.subtitle ?? '',
            techStack: detail.techStack.join(', '),
            githubLink: detail.githubLink ?? '',
            websiteLink: detail.websiteLink ?? '',
          });
        },
        error: (error: unknown) => this.error.set(this.adminService.errorMessage(error)),
      });
  }
  private beginEditor(kind: 'blogs' | 'projects', id: number | null): void {
    this.detailRequest?.unsubscribe();
    this.error.set('');
    this.success.set('');
    this.editingId = id;
    this.editingVersion = undefined;
    this.editing.set(id !== null);
    this.editorReady.set(id === null);
    this.editor.set(kind);
    this.editorDialog.nativeElement.showModal();
  }
  public closeEditor(event?: Event): void {
    if (this.busy()) {
      event?.preventDefault();
      return;
    }
    this.detailRequest?.unsubscribe();
    this.editorDialog.nativeElement.close();
    this.editor.set(null);
    this.error.set('');
    this.blogForm.reset();
    this.chapters.clear();
    this.projectForm.reset();
  }
  public addChapter(): void {
    if (this.chapters.length < 20) this.chapters.push(this.chapter());
  }
  public removeChapter(index: number): void {
    this.chapters.removeAt(index);
  }
  public moveChapter(index: number, direction: number): void {
    const next = index + direction;
    if (next < 0 || next >= this.chapters.length) return;
    const chapter = this.chapters.at(index);
    this.chapters.removeAt(index);
    this.chapters.insert(next, chapter);
  }
  public save(): void {
    if (
      this.busy() ||
      this.editorLoading() ||
      (this.editing() && this.editingVersion === undefined)
    )
      return;
    const form = this.editor() === 'blogs' ? this.blogForm : this.projectForm;
    if (form.invalid) {
      form.markAllAsTouched();
      this.error.set(
        'Check the highlighted fields. Required text cannot be blank; links must use HTTPS.',
      );
      return;
    }
    let request: Observable<unknown>;
    if (this.editor() === 'blogs') {
      const value = this.blogForm.getRawValue();
      if (value.status === 'PUBLISHED' && value.chapters.length === 0) {
        this.error.set('Published blogs require at least one chapter.');
        return;
      }
      const bytes = new TextEncoder().encode(
        value.chapters.map((chapter) => chapter.content).join(''),
      ).length;
      if (bytes > 200 * 1024) {
        this.error.set('Chapter content must not exceed 200 KiB in UTF-8.');
        return;
      }
      request = this.adminService.savePost(
        {
          ...value,
          title: value.title.trim(),
          version: this.editingVersion,
          chapters: value.chapters.map((chapter, index) => ({
            ...chapter,
            chapterOrder: index + 1,
          })),
        },
        this.editingId,
      );
    } else {
      const value = this.projectForm.getRawValue();
      const techStack = [
        ...new Set(
          value.techStack
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean),
        ),
      ];
      if (techStack.some((tech) => tech.length > 50)) {
        this.error.set('Each technology must contain at most 50 characters.');
        return;
      }
      request = this.adminService.saveProject(
        { ...value, title: value.title.trim(), techStack, version: this.editingVersion },
        this.editingId,
      );
    }
    this.busy.set(true);
    this.error.set('');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.closeEditor();
          this.success.set('Changes saved by the server.');
          this.refresh();
        },
        error: (error: unknown) => this.error.set(this.adminService.errorMessage(error)),
      });
  }
  public promptDelete(kind: 'blogs' | 'projects' | 'contacts', id: number, label: string): void {
    this.error.set('');
    this.blockReason.reset('');
    this.confirmation.set({
      title: 'Delete this record permanently?',
      label,
      run: () => this.adminService.deleteRecord(kind, id),
      after: () => {
        this.selectedContact.set(null);
        this.refresh();
      },
    });
    this.confirmDialog.nativeElement.showModal();
  }
  public promptBlock(visitor: AdminVisitor): void {
    this.error.set('');
    this.blockReason.reset('');
    this.confirmation.set({
      title: visitor.blocked ? 'Unblock this visitor?' : 'Block this visitor?',
      label: `Visitor #${visitor.id}`,
      needsReason: !visitor.blocked,
      run: () =>
        this.adminService.blockVisitor(visitor.id, !visitor.blocked, this.blockReason.value),
      after: () => this.adminService.loadVisitors(),
    });
    this.confirmDialog.nativeElement.showModal();
  }
  public cancelConfirmation(event?: Event): void {
    if (this.busy()) {
      event?.preventDefault();
      return;
    }
    this.confirmDialog.nativeElement.close();
    this.confirmation.set(null);
    this.error.set('');
  }
  public confirm(): void {
    const action = this.confirmation();
    if (!action || this.busy() || this.blockReason.invalid) return;
    this.busy.set(true);
    this.error.set('');
    action
      .run()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.cancelConfirmation();
          this.success.set('The server confirmed the change.');
          action.after();
        },
        error: (error: unknown) => this.error.set(this.adminService.errorMessage(error)),
      });
  }
  public changeVisitorPage(direction: number): void {
    const page = this.adminService.visitorPage() + direction;
    if (page >= 0 && page <= 1000 && !this.adminService.loading().visitors)
      this.adminService.loadVisitors(page);
  }
  public logout(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.adminService
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        error: (error: unknown) => this.error.set(this.adminService.errorMessage(error)),
      });
  }
}
