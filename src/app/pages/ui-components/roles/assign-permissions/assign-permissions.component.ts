import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { CategoryDto } from 'src/app/_interface/category';
import { PermissionDto } from 'src/app/_interface/permission';
import { RolePermissionDto, RolePermissionForAssignmentDto, CategoryPermissionAssignmentDto } from 'src/app/_interface/role-permission';

@Component({
  selector: 'app-assign-permissions',
  templateUrl: './assign-permissions.component.html',
  styleUrls: ['./assign-permissions.component.scss']
})
export class AssignPermissionsComponent implements OnInit {
  roleId: string;
  categories: CategoryDto[] = [];
  permissions: PermissionDto[] = [];
  rolePermissions: RolePermissionDto[] = [];
  permissionAssignments: { [categoryId: string]: { [permissionId: string]: boolean } } = {};
  displayedColumns: string[] = [];
  isSaving: boolean = false; // Thêm trạng thái loading
  constructor(
    private repoService: RepositoryService,
    private dialogRef: MatDialogRef<AssignPermissionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { roleId: string }
  ) {
    this.roleId = data.roleId;
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPermissions();
    this.loadRolePermissions();
  }

  loadCategories(): void {
    this.repoService.getData('api/categories').subscribe({
      next: (categories) => {
        this.categories = categories as CategoryDto[];
        this.initializeAssignments();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadPermissions(): void {
    this.repoService.getData('api/permissions').subscribe({
        next: (data) => {
            // Ép kiểu dữ liệu thành PermissionDto[]
            const permissions: PermissionDto[] = data as PermissionDto[];
            this.permissions = permissions;
            this.displayedColumns = ['category', ...permissions.map((p: PermissionDto) => p.name ?? '')];
            this.initializeAssignments();
        },
        error: (err) => {
            console.error('Error loading permissions:', err);
        }
    });
  }

  loadRolePermissions(): void {
    console.log('Role ID:', this.roleId);
    this.repoService.getData(`api/rolepermissions/role/${this.roleId}`).subscribe({
      next: (rolePermissions) => {
        this.rolePermissions = rolePermissions as RolePermissionDto[];
        this.initializeAssignments();
      },
      error: (err) => {
        console.error('Error loading role permissions:', err);
      }
    });
  }

  initializeAssignments(): void {
    if (this.categories.length === 0 || this.permissions.length === 0) {
      return;
    }
    this.permissionAssignments = {};
    this.categories.forEach(category => {
      if (category.id) {
        this.permissionAssignments[category.id] = {};
      }
      this.permissions.forEach(permission => {
        const isAssigned = this.rolePermissions.some(
          rp => rp.categoryId === category.id && rp.permissionId === permission.id
        );
        if (category.id && permission.id) {
          this.permissionAssignments[category.id][permission.id] = isAssigned;
        }
      });
    });
  }

  savePermissions(): void {
    this.isSaving = true; // Bật trạng thái loading
    const assignment: RolePermissionForAssignmentDto = {
      roleId: this.roleId,
      categoryAssignments: []
    };

    this.categories.forEach(category => {
        const selectedPermissionIds = this.permissions
            .filter(permission => category.id && permission.id && this.permissionAssignments[category.id][permission.id])
            .map(permission => permission.id);
    
        if (selectedPermissionIds.length > 0 && category.id) { // Kiểm tra category.id
            const categoryAssignment: CategoryPermissionAssignmentDto = {
                categoryId: category.id,
                permissionIds: selectedPermissionIds.filter((id): id is string => !!id)
            };
            assignment.categoryAssignments.push(categoryAssignment);
        }
    });
    this.repoService.create('api/rolepermissions/assign', assignment).subscribe({
      next: () => {
        alert('Permissions assigned successfully');
        this.isSaving = false; // Tắt trạng thái loading
        this.dialogRef.close(true); // Đóng dialog và báo thành công
      },
      error: (err) => {
        console.error('Error assigning permissions:', err);
        this.isSaving = false; // Tắt trạng thái loading

      }
    });
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}