import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AdminLoginComponent } from './admin_login.component';
import { AdminDashboardComponent } from './admin_dashboard.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminLoginComponent, AdminDashboardComponent],
  templateUrl: '../templates/admin.component.html',
})
export class AdminComponent {
  public adminService = inject(AdminService);
}
