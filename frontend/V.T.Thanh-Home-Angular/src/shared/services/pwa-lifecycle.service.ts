import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConnectivityService } from './connectivity.service';
import { PendingWorkService } from './pending-work.service';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ResourceReceipt {
  entryScripts: string[];
  resources: { url: string; sha256: string }[];
}

@Injectable({ providedIn: 'root' })
export class PwaLifecycleService {
  private readonly updates = inject(SwUpdate);
  private readonly connectivity = inject(ConnectivityService);
  public readonly pendingWork = inject(PendingWorkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly installPrompt = signal<InstallPromptEvent | null>(null);
  public readonly installed = signal(false);
  public readonly isStandalone = signal(false);
  public readonly installing = signal(false);
  public readonly installFailed = signal(false);
  public readonly readiness = signal<'checking' | 'ready' | 'incomplete' | 'unsupported'>(
    this.updates.isEnabled && 'caches' in window ? 'checking' : 'unsupported',
  );
  public readonly updateAvailable = signal(false);
  public readonly updateFailed = signal(false);
  public readonly checkingUpdate = signal(false);
  public readonly unrecoverable = signal(false);
  public readonly canInstall = computed(
    () => !this.installed() && !!this.installPrompt() && !this.installing(),
  );
  public readonly canReload = computed(
    () => this.connectivity.online() && !this.pendingWork.hasUnsavedWork(),
  );
  private verifying = false;
  private recheckPending = false;
  private destroyed = false;

  constructor() {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => {
      const standalone =
        displayMode.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
      this.isStandalone.set(standalone);
      if (standalone) this.installed.set(true);
    };
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      this.installPrompt.set(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      this.installed.set(true);
      this.installPrompt.set(null);
    };
    updateInstalled();
    displayMode.addEventListener('change', updateInstalled);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      displayMode.removeEventListener('change', updateInstalled);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    });
    effect((onCleanup) => {
      if (!this.pendingWork.hasUnsavedWork()) return;
      const protectDraft = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
      };
      window.addEventListener('beforeunload', protectDraft);
      onCleanup(() => window.removeEventListener('beforeunload', protectDraft));
    });
    if (!this.updates.isEnabled) return;
    const recheck = () => {
      void this.verifyOfflineResources();
    };
    const resume = () => {
      if (document.visibilityState !== 'visible') return;
      recheck();
      void this.checkForUpdate();
    };
    navigator.serviceWorker.addEventListener('controllerchange', recheck);
    window.addEventListener('online', resume);
    window.addEventListener('offline', recheck);
    document.addEventListener('visibilitychange', resume);
    const preparationTimer = window.setInterval(() => {
      if (this.readiness() !== 'ready' && !this.verifying) recheck();
    }, 15000);
    this.destroyRef.onDestroy(() => {
      clearInterval(preparationTimer);
      navigator.serviceWorker.removeEventListener('controllerchange', recheck);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', recheck);
      document.removeEventListener('visibilitychange', resume);
    });
    this.updates.versionUpdates.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.type === 'VERSION_READY') this.updateAvailable.set(true);
      if (event.type === 'VERSION_INSTALLATION_FAILED') this.updateFailed.set(true);
      recheck();
    });
    this.updates.unrecoverable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.unrecoverable.set(true);
      this.readiness.set('incomplete');
    });
    navigator.serviceWorker.ready
      .then(() => {
        if (!this.destroyed) {
          recheck();
          void this.checkForUpdate();
        }
      })
      .catch(() => this.readiness.set('incomplete'));
    recheck();
  }

  public async verifyOfflineResources(): Promise<void> {
    if (
      this.destroyed ||
      this.readiness() === 'unsupported' ||
      this.unrecoverable() ||
      !navigator.serviceWorker.controller
    )
      return;
    if (this.verifying) {
      this.recheckPending = true;
      return;
    }
    this.verifying = true;
    try {
      const response = await fetch('/pwa-resources.json', { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Offline receipt unavailable');
      const receiptText = await response.text();
      const receipt = JSON.parse(receiptText) as ResourceReceipt;
      if (!Array.isArray(receipt.resources) || !receipt.resources.length)
        throw new Error('Invalid offline receipt');
      const pageAssets = [...document.scripts]
        .map((script) => script.src)
        .filter(Boolean)
        .map((src) => new URL(src))
        .filter((url) => url.origin === location.origin);
      if (
        !Array.isArray(receipt.entryScripts) ||
        !receipt.entryScripts.length ||
        receipt.entryScripts.some((path) => !pageAssets.some((url) => url.pathname === path))
      )
        throw new Error('Page version does not match installed package');
      const caches = await Promise.all(
        (await window.caches.keys()).map((name) => window.caches.open(name)),
      );
      let receiptCached = false;
      for (const cache of caches) {
        const cached = await cache.match(new URL('/pwa-resources.json', location.origin).href);
        if (cached?.ok && (await cached.text()) === receiptText) {
          receiptCached = true;
          break;
        }
      }
      if (!receiptCached) throw new Error('Offline receipt is not cached');
      let complete = true;
      for (const resource of receipt.resources) {
        if (
          !resource.url.startsWith('/') ||
          resource.url.startsWith('//') ||
          !/^[a-f0-9]{64}$/.test(resource.sha256)
        )
          throw new Error('Invalid offline resource');
        let found = false;
        for (const cache of caches) {
          const cached = await cache.match(new URL(resource.url, location.origin).href);
          if (!cached?.ok) continue;
          const digest = await crypto.subtle.digest('SHA-256', await cached.arrayBuffer());
          const hash = [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
          if (hash === resource.sha256) {
            found = true;
            break;
          }
        }
        if (!found) {
          complete = false;
          break;
        }
      }
      if (!this.destroyed && !this.recheckPending && !this.unrecoverable())
        this.readiness.set(complete ? 'ready' : 'incomplete');
    } catch {
      if (!this.destroyed) this.readiness.set('incomplete');
    } finally {
      this.verifying = false;
      if (this.recheckPending) {
        this.recheckPending = false;
        void this.verifyOfflineResources();
      }
    }
  }

  public async checkForUpdate(): Promise<void> {
    if (
      !this.updates.isEnabled ||
      !this.connectivity.online() ||
      this.checkingUpdate() ||
      this.destroyed
    )
      return;
    this.checkingUpdate.set(true);
    this.updateFailed.set(false);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
      await this.updates.checkForUpdate();
    } catch {
      this.updateFailed.set(true);
    } finally {
      this.checkingUpdate.set(false);
    }
  }

  public reload(): void {
    if (this.canReload() && (this.updateAvailable() || this.unrecoverable()))
      window.location.reload();
  }

  public async install(): Promise<void> {
    const prompt = this.installPrompt();
    if (!prompt || this.installing() || this.installed()) return;
    this.installing.set(true);
    this.installFailed.set(false);
    this.installPrompt.set(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      this.installFailed.set(true);
    } finally {
      this.installing.set(false);
    }
  }
}
