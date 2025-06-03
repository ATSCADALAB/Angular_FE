import { Routes } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { AuditsComponent } from './audits/audits.component';
import { AboutComponent } from './about/about.component';
import { CategoriesComponent } from './categories/categories.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { ProductsComponent } from './products/products.component';
import { ProductInformationsComponent } from './product-information/product-informations.component';
import { OrdersComponent } from './orders/orders.component';
import { OrderDetailsComponent } from './orders/order-detail/order-details.component';
import { AreasComponent } from './areas/areas.component';
import { LinesComponent } from './lines/lines.component';
import { DistributorsComponent } from './distributors/distributors.component';
import { ReportComponent } from './report/report.component';
import { InboundComponent } from './inbound/inbound.component';
import { OutboundComponent } from './outbound/outbound.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { AuthGuard } from 'src/app/guards/auth.guard';
export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'stock-report',
        component: StockReportComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'inbound',
        component: InboundComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'outbound',
        component: OutboundComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'reports',
        component: ReportComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'lines',
        component: LinesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'areas',
        component: AreasComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'order-details/:id',
        component: OrderDetailsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'orders',
        component: OrdersComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'products',
        component: ProductsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'product-informations',
        component: ProductInformationsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'distributors',
        component: DistributorsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'roles',
        component: RolesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'permissions',
        component: PermissionsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'audits',
        component: AuditsComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'about',
        component: AboutComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];
