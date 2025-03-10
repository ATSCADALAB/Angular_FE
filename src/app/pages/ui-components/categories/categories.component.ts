import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UpdateCategoryComponent } from './update-category/update-category.component';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { AddCategoryComponent } from './add-category/add-category.component';
import { Subscription } from 'rxjs';
import { DataService } from 'src/app/shared/services/data.service';
import { CategoryDto } from 'src/app/_interface/category';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html'
})
export class CategoriesComponent implements OnInit {

  displayedColumns: string[] = ['action', 'category'];
  public dataSource = new MatTableDataSource<CategoryDto>();
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
      this.repoService.getData('api/categories')
      .subscribe(res => {
        this.dataSource.data = res as CategoryDto[];
        
      },
      (err) => {
        console.log(err);
      })
    }

    addCategory() {
      const popup = this.dialog.open(AddCategoryComponent, {
        width: '500px', height: '232px',
        enterAnimationDuration: '100ms',
        exitAnimationDuration: '100ms',
      });
    }
    UpdateCategory(id:string) {
      const popup = this.dialog.open(UpdateCategoryComponent, {
        width: '500px', height: '232px',
        enterAnimationDuration: '100ms',
        exitAnimationDuration: '100ms',
        data:{
          id:id
         }
      });
    }

    DeleteCategory(id: any) {
      this.dialogserve.openConfirmDialog('Are you sure, you want to delete the category ?')
        .afterClosed()
        .subscribe(   (res) => {
          if (res) {
            const deleteUri: string = `api/categories/${id}`;
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
