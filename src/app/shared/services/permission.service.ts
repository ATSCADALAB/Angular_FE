import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RolePermissionDto } from 'src/app/_interface/role-permission';
import { RepositoryService } from './repository.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private repoService: RepositoryService) {}

  getViewableCategories(roleId: string): Observable<string[]> {
    return this.repoService.getData(`api/rolepermissions/role-map-permissions/${roleId}`).pipe(
      map((data: any) => {
        const rolePermissions: RolePermissionDto[] = data as RolePermissionDto[];
        // Lọc các danh mục có quyền "View"
        return rolePermissions
        .filter(rp => rp.permissionName.toLowerCase() === 'view')
        .map(rp => rp.categoryName);
          
      })
    );
  }
}