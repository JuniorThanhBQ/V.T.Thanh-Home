import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { HomeShaderService } from '@/features/home/services/home-shader.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: '../templates/home.component.html',
  providers: [HomeShaderService],
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;
  private shaderService = inject(HomeShaderService);
 
  ngAfterViewInit(): void {
    this.shaderService.init(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.shaderService.destroy();
  }
}