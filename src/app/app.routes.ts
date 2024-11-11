import { Routes } from '@angular/router';
import { UploaderComponent } from './components/uploader/uploader.component';

export const routes: Routes = [
  { path: 'dashboard', component: UploaderComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
