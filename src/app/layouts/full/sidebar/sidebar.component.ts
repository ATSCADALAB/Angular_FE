import { Component, OnInit } from '@angular/core';
import { navItems } from './sidebar-data';
import { NavService } from 'src/app/shared/services/nav.service';
import { NavItem } from './nav-item/nav-item';
import { AuthenticationService } from 'src/app/shared/services/authentication.service';
import { PermissionService } from 'src/app/shared/services/permission.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  navItems: NavItem[] = [];
  filteredNavItems: NavItem[] = [];

  constructor(
    public navService: NavService,
    private authService: AuthenticationService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.navItems = navItems;
    this.filterNavItems();
  }

  filterNavItems(): void {
    const roles = this.authService.loadCurrentUserRole();
    if (!roles) {
      this.filteredNavItems = this.navItems.filter(item => !item.route || item.route === '/dashboard');
      return;
    }

    // Giả định người dùng chỉ có một vai trò
    const roleId = Array.isArray(roles) ? roles[0] : roles;

    this.permissionService.getViewableCategories(roleId).subscribe({
      next: (viewableCategories: string[]) => {
        console.log('Viewable Categories:', viewableCategories);
        this.filteredNavItems = this.navItems.filter(item => {
          // Giữ lại các mục không có route (như navCap) hoặc mục Dashboard
          if (!item.route || item.route === '/dashboard' || item.route === '/ui-components/about') {
            return true;
          }

          // Ánh xạ route với danh mục
          const routeToCategoryMap: { [key: string]: string } = {
            '/ui-components/roles': 'Roles',
            '/ui-components/users': 'Users',
            '/ui-components/categories': 'Categories',
            '/ui-components/permissions': 'Permissions',
            '/ui-components/distributors': 'Distributors',
            '/ui-components/products': 'Products',
            '/ui-components/product-informations': 'ProductInformations',
            '/ui-components/lists': 'Customers',
            '/ui-components/audits': 'Logs',
            '/ui-components/about': 'About',
            '/ui-components/orders': 'Orders',
            '/ui-components/areas': 'Areas',
            '/ui-components/lines': 'Lines',

          };

          const category = routeToCategoryMap[item.route];
          console.log(category);
          if (!category) {
            return false; // Nếu route không ánh xạ với danh mục nào, không hiển thị
          }

          // Hiển thị mục nếu danh mục có quyền "View"
          return viewableCategories.includes(category);
        });
      },
      error: (err) => {
        console.error('Error loading viewable categories:', err);
        // Nếu lỗi, chỉ hiển thị các mục mặc định (Dashboard, About, navCap)
        this.filteredNavItems = this.navItems.filter(item => !item.route || item.route === '/dashboard' || item.route === '/ui-components/about');
      }
    });
  }
}