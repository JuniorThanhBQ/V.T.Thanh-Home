import {
  Component,
  HostListener,
  OnDestroy,
  inject,
  computed,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AVATAR_URLS, getDynamicLogo } from '@/assets/cloudinaryUrl';
import { TranslationService } from '@/shared/services/translation.service';
import { ThemeService } from '@/shared/services/theme.service';
import { BackendHealthService } from '@/shared/services/backend-health.service';
import { MarkdownPipe } from '@/shared/pipes/markdown.pipe';
import { ChatComponentService } from '../services/chat-component.service';
import { PendingWorkService } from '@/shared/services/pending-work.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: '../templates/chat-components.html',
})
export class ChatbotComponent implements OnDestroy {
  public i18n = inject(TranslationService);
  public theme = inject(ThemeService);
  public health = inject(BackendHealthService);
  public chatService = inject(ChatComponentService);
  private readonly pendingWork = inject(PendingWorkService);

  @ViewChild('messageContainer') private messageContainer?: ElementRef<HTMLDivElement>;

  public readonly avatarUrls = AVATAR_URLS;
  public readonly greetingTime = '11:08 AM';

  public isOpen = false;
  private draft = '';
  public get messageInput(): string {
    return this.draft;
  }
  public set messageInput(value: string) {
    this.draft = value;
    this.pendingWork.chatDraft.set(value.trim().length > 0);
  }

  public readonly logoUrl = computed(() =>
    getDynamicLogo(this.i18n.currentLang(), this.theme.currentTheme()),
  );

  public healthStatusText = computed(() => {
    if (!this.health.connectivity.online()) return this.i18n.t('pwa.offline');
    const status = this.health.status();
    if (status === 'UP') {
      return this.i18n.t('chat.status_active');
    }
    if (status === 'DOWN') {
      return this.i18n.t('app.backend_health_down');
    }
    return this.i18n.t('app.backend_health_standby');
  });

  public inputPlaceholder = computed(() => {
    if (!this.health.available()) {
      return this.i18n.t('chat.unavailable');
    }
    return this.i18n.t('chat.input_placeholder');
  });

  public readonly suggestedTopicKeys: string[] = [
    'chat.topics.tech_stack',
    'chat.topics.projects',
    'chat.topics.contact',
  ];

  constructor() {
    effect(() => {
      const failed = this.chatService.failedMessage();
      if (failed && !this.messageInput.trim()) this.messageInput = failed;
    });
  }

  public openChat(): void {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  public closeChat(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  public selectTopic(topicKey: string): void {
    if (!this.health.available()) {
      return;
    }
    this.messageInput = this.i18n.t(topicKey);
  }

  public sendMessage(): void {
    if (!this.health.available()) {
      return;
    }
    const trimmed = this.messageInput.trim();
    if (!trimmed || trimmed.length > 1000 || this.chatService.isSending()) {
      return;
    }
    this.chatService.sendMessage(trimmed);
    this.messageInput = '';
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTo({
          top: this.messageContainer.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 0);
  }

  ngOnDestroy(): void {
    if (typeof document === 'undefined') return;
    this.pendingWork.chatDraft.set(false);
    document.body.style.overflow = '';
  }

  @HostListener('window:keydown.escape')
  public onEscape(): void {
    if (this.isOpen) {
      this.closeChat();
    }
  }
}
