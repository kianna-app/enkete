import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { PollPageComponent } from './pages/poll/poll-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'poll/:id', component: PollPageComponent },
  { path: '**', redirectTo: '' }
];
