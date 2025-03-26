import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UserRoleDto } from 'src/app/_interface/user';
import { ToastrService } from 'ngx-toastr';
import { UpdateRoleComponent } from './update-role/update-role.component';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { AddRoleComponent } from './add-role/add-role.component';
import { AssignPermissionsComponent } from './assign-permissions/assign-permissions.component';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html'
})
export class RolesComponent implements OnInit {
  displayedColumns: string[] = ['action', 'role', 'date'];
  public dataSource = new MatTableDataSource<UserRoleDto>();
  private refreshSubscription!: Subscription;

  constructor(    
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private dataService: DataService,
    private dialogserve: DialogService
  ) { 
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getRoles();
    });
  }

  ngOnInit(): void {
    this.getRoles();
  }

  public getRoles() {
    this.repoService.getData('api/roles')
      .subscribe({
        next: (res) => {
          this.dataSource.data = res as UserRoleDto[];
        },
        error: (err) => {
          console.error('Error loading roles:', err);
        }
      });
  }

  addRole() {
    const popup = this.dialog.open(AddRoleComponent, {
      width: '500px',
      height: '232px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms'
    });
  }

  updateRole(id: string) {
    const popup = this.dialog.open(UpdateRoleComponent, {
      width: '500px',
      height: '232px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  assignPermissions(roleId: string) {
    const popup = this.dialog.open(AssignPermissionsComponent, {
      width: '700px',
      maxHeight: '80vh',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { roleId }
    });

    popup.afterClosed().subscribe(result => {
      if (result) {
        this.getRoles(); // Làm mới danh sách vai trò nếu cần
      }
    });
  }

  deleteRole(id: string) {
    this.dialogserve.openConfirmDialog('Are you sure, you want to delete the role?')
      .afterClosed()
      .subscribe(res => {
        if (res) {
          const deleteUri: string = `api/roles/${id}`;
          this.repoService.delete(deleteUri).subscribe({
            next: () => {
              this.dialogserve.openSuccessDialog("The role has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getRoles();
                });
            },
            error: (err) => {
              console.error('Error deleting role:', err);
            }
          });
        }
      });
  }
}