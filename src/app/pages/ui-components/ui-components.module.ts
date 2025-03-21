import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { UiComponentsRoutes } from './ui-components.routing';
import { MatNativeDateModule } from '@angular/material/core';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { AuditsComponent } from './audits/audits.component';
import { ToastrModule } from 'ngx-toastr';
import { AddUserComponent } from './users/add-user/add-user.component';
import { UpdateUserComponent } from './users/update-user/update-user.component';
import { AddRoleComponent } from './roles/add-role/add-role.component';
import { UpdateRoleComponent } from './roles/update-role/update-role.component';
import { AboutComponent } from './about/about.component';
import { CategoriesComponent } from './categories/categories.component';
import { AddCategoryComponent } from './categories/add-category/add-category.component';
import { UpdateCategoryComponent } from './categories/update-category/update-category.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { AddPermissionComponent } from './permissions/add-permission/add-permission.component';
import { UpdatePermissionComponent } from './permissions/update-permission/update-permission.component';
import { AssignPermissionsComponent } from './roles/assign-permissions/assign-permissions.component';
import { AddDistributorComponent } from './distributors/add-distributor/add-distributor.component';
import { UpdateDistributorComponent } from './distributors/update-distributor/update-distributor.component';
import { DistributorsComponent } from './distributors/distributors.component';
import { ProductsComponent } from './products/products.component';
import { AddProductComponent } from './products/add-product/add-product.component';
import { UpdateProductComponent } from './products/update-product/update-product.component';
import { ProductInformationsComponent } from './product-information/product-informations.component';
import { AddProductInformationComponent } from './product-information/add-product-information/add-product-information.component';
import { UpdateProductInformationComponent } from './product-information/update-product-information/update-product-information.component';
import { ProductDetailComponent } from './products/product-detail/product-detail.component';
// import { AddOrderComponent } from './orders/add-order/add-order.component';
// import { UpdateOrderComponent } from './orders/update-order/update-order.component';
import { OrdersComponent } from './orders/order.component';
import { AreasComponent } from './areas/areas.component';
import { AddAreaComponent } from './areas/add-area/add-area.component';
import { UpdateAreaComponent } from './areas/update-area/update-area.component';
import { AddLineComponent } from './lines/add-line/add-line.component';
import { UpdateLineComponent } from './lines/update-line/update-line.component';
import { LinesComponent } from './lines/lines.component';
import { ReportComponent } from './report/report.component';
import { InboundComponent } from './inbound/inbound.component';
import { OutboundComponent } from './outbound/outbound.component';
import { StockReportComponent } from './stock-report/stock-report.component';
import { AddInboundComponent } from './inbound/add-inbound/add-inbound.component';
import { AddOutboundComponent } from './outbound/add-outbound/add-outbound.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(UiComponentsRoutes),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule.pick(TablerIcons),
    MatNativeDateModule,
    ToastrModule.forRoot({
      timeOut: 3000, 
      positionClass: 'toast-top-right', 
      preventDuplicates: true, 
      progressBar: true, 
      closeButton: true 
    })
  ],
  declarations: [
    UsersComponent,
    RolesComponent,
    AuditsComponent,
    AddUserComponent,
    UpdateUserComponent,
    AddRoleComponent,
    UpdateRoleComponent,
    AboutComponent,
    CategoriesComponent,
    AddCategoryComponent,
    UpdateCategoryComponent,
    PermissionsComponent,
    AddPermissionComponent,
    UpdatePermissionComponent,
    AssignPermissionsComponent,
    AddDistributorComponent,
    UpdateDistributorComponent,
    DistributorsComponent,
    ProductsComponent,
    AddProductComponent,
    UpdateProductComponent,
    ProductDetailComponent,
    ProductInformationsComponent,
    AddProductInformationComponent,
    UpdateProductInformationComponent,
    // AddOrderComponent,
    // UpdateOrderComponent,
    OrdersComponent,
    OrdersComponent,
    //Ares
    AreasComponent,
    AddAreaComponent,
    UpdateAreaComponent,
    //Lines
    AddLineComponent,
    UpdateLineComponent,
    LinesComponent,
    ReportComponent,
    InboundComponent,
    AddInboundComponent,
    OutboundComponent,
    AddOutboundComponent,
    StockReportComponent
  ],
})
export class UicomponentsModule {}
