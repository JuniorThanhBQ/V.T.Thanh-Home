import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AVATAR_URLS } from '@/assets/cloudinaryUrl';
import { TranslationService } from '@/shared/services/translation.service';
import { ThemeService } from '@/shared/services/theme.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: '../templates/chat-components.html',
})
export class ChatbotComponent implements OnDestroy {
  public i18n = inject(TranslationService);
  public theme = inject(ThemeService);

  public readonly avatarUrls = AVATAR_URLS;
  public readonly greetingTime = '11:08 AM';

  public isOpen = false;
  public messageInput = '';

  public readonly suggestedTopicKeys: string[] = [
    'chat.topics.tech_stack',
    'chat.topics.projects',
    'chat.topics.contact',
  ];

  public openChat(): void {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  public closeChat(): void {
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  public selectTopic(topicKey: string): void {
    this.messageInput = this.i18n.t(topicKey);
  }

  public sendMessage(): void {
    const trimmed = this.messageInput.trim();
    if (!trimmed) {
      return;
    }
    this.messageInput = '';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('window:keydown.escape')
  public onEscape(): void {
    if (this.isOpen) {
      this.closeChat();
    }
  }
}
