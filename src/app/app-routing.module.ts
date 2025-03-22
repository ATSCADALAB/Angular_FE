import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './guards/auth.guard';
import { ServerErrorComponent } from './errors/server-error/server-error.component';
import { OrderDetailsComponent } from './pages/ui-components/orders/order-detail/order-details.component';
import { CanDeactivateGuard } from './shared/services/can-deactivate.guard';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.module').then(
            (m) => m.UicomponentsModule
          ),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.module').then(
            (m) => m.AuthenticationModule
          ),
      },
    ],
  },
  { path: '500', component: ServerErrorComponent },
  { path: 'order-details/:id', 
    component: OrderDetailsComponent, 
    canDeactivate: [CanDeactivateGuard] 
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
