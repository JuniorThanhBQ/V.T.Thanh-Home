import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PendingWorkService {
  public readonly contactDraft = signal(false);
  public readonly chatDraft = signal(false);
  public readonly contactSending = signal(false);
  public readonly chatSending = signal(false);
  public readonly busy = computed(() => this.contactSending() || this.chatSending());
  public readonly hasUnsavedWork = computed(
    () => this.busy() || this.contactDraft() || this.chatDraft(),
  );
}
