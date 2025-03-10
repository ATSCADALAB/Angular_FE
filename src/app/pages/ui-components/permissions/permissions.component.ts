import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { PermissionDto } from 'src/app/_interface/permission';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { AddPermissionComponent } from './add-permission/add-permission.component';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/shared/services/data.service';
import { UpdatePermissionComponent } from './update-permission/update-permission.component';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html'
})
export class PermissionsComponent implements OnInit {

  displayedColumns: string[] = ['action', 'permission'];
  public dataSource = new MatTableDataSource<PermissionDto>();
  private refreshSubscription!: Subscription;

  constructor(    
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private dataService: DataService,
    private dialogserve: DialogService,) { 
      this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
        this.getCategories();
      });
    }
    ngOnInit(): void {
      this.getCategories();
    }
  
    public getCategories(){
      this.repoService.getData('api/permissions')
      .subscribe(res => {
        this.dataSource.data = res as PermissionDto[];
        
      },
      (err) => {
        console.log(err);
      })
    }

    addPermission() {
      const popup = this.dialog.open(AddPermissionComponent, {
        width: '500px', height: '232px',
        enterAnimationDuration: '100ms',
        exitAnimationDuration: '100ms',
      });
    }
    UpdatePermission(id:string) {
      const popup = this.dialog.open(UpdatePermissionComponent, {
        width: '500px', height: '232px',
        enterAnimationDuration: '100ms',
        exitAnimationDuration: '100ms',
        data:{
          id:id
         }
      });
    }

    DeletePermission(id: any) {
      this.dialogserve.openConfirmDialog('Are you sure, you want to delete the Permission ?')
        .afterClosed()
        .subscribe(   (res) => {
          if (res) {
            const deleteUri: string = `api/permissions/${id}`;
            this.repoService.delete(deleteUri).subscribe((res) => {
              this.dialogserve.openSuccessDialog("The role has been deleted successfully.")
              .afterClosed()
              .subscribe((res) => {
                this.getCategories();
              });
            });
          }
        });
    }

}
