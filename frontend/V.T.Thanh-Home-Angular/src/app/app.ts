import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@/shared/components/header/header.component';
import { FooterComponent } from '@/shared/components/footer/footer.component';
import { LoadingComponent } from '../shared/components/loading/loading.component';
import { LoadingService } from '../shared/services/loading.service';
import { ColorWipeComponent } from '@/shared/components/color-wipe/color-wipe.component';
// import { ChatbotComponent } from '@/features/chat/components/chat.component';

@Component({
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoadingComponent, ColorWipeComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  public loading = inject(LoadingService);
  protected readonly title = signal('V.T.Thanh-Home-Angular');
}
