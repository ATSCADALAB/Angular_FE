import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { AreaDto } from 'src/app/_interface/area';
import { AddAreaComponent } from './add-area/add-area.component';
import { UpdateAreaComponent } from './update-area/update-area.component';

@Component({
  selector: 'app-areas',
  templateUrl: './areas.component.html',
  styleUrls: ['./areas.component.scss']
})
export class AreasComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'areaCode', 'areaName', 'createdAt', 'updatedAt'];
  public dataSource = new MatTableDataSource<AreaDto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getAreas();
    });
  }

  ngOnInit(): void {
    this.getAreas();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public getAreas() {
    this.repoService.getData('api/areas')
      .subscribe(
        (res) => {
          this.dataSource.data = res as AreaDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addArea() {
    this.dialog.open(AddAreaComponent, {
      width: '500px',
      height: '400px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateArea(id: number) {
    this.dialog.open(UpdateAreaComponent, {
      width: '500px',
      height: '400px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteArea(id: number) {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this area?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/areas/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService.openSuccessDialog("The area has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getAreas();
                });
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}