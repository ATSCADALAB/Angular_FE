import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { AuditsComponent } from './audits/audits.component';
import { AboutComponent } from './about/about.component';
import { CategoriesComponent } from './categories/categories.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { ProductsComponent } from './products/products.component';
import { ProductInformationsComponent } from './product-information/product-informations.component';
import { OrdersComponent } from './orders/order.component';
// import { OrderDetailsComponent } from './orders/order-detail/order-details.component';
import { AreasComponent } from './areas/areas.component';
import { LinesComponent } from './lines/lines.component';
import { DistributorsComponent } from './distributors/distributors.component';
import { ReportComponent } from './report/report.component';

export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'reports',
        component: ReportComponent,
      },
      {
        path: 'lines',
        component: LinesComponent,
      },
      {
        path: 'areas',
        component: AreasComponent,
      },
      // {
      //   path: 'order-details/:id',
      //   component: OrderDetailsComponent,
      // },
      {
        path: 'orders',
        component: OrdersComponent,
      },
      {
        path: 'products',
        component: ProductsComponent,
      },
      {
        path: 'product-informations',
        component: ProductInformationsComponent,
      },
      {
        path: 'distributors',
        component: DistributorsComponent,
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
    ],
  },
];
