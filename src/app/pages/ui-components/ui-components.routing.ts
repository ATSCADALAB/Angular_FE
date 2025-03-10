import { Routes } from '@angular/router';
import { AppListsComponent } from './lists/lists.component';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { AuditsComponent } from './audits/audits.component';
import { DetailsComponent } from './lists/details/details.component';
import { AboutComponent } from './about/about.component';
import { CategoriesComponent } from './categories/categories.component';
import { PermissionsComponent } from './permissions/permissions.component';

export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'lists',
        component: AppListsComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
      {
        path: 'categories',
        component: CategoriesComponent,
      },
      {
        path: 'permissions',
        component: PermissionsComponent,
      },
      {
        path: 'audits',
        component: AuditsComponent,
      },
      {
        path: 'about',
        component: AboutComponent,
      },
      {
        path: 'customer-details/:id',
        component: DetailsComponent,
      },
    ],
  },
];
