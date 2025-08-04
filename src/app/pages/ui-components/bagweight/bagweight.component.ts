import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { UpdateBagWeightComponent } from './update-bagweight/update-bagweight.component';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { BagWeight } from 'src/app/_interface/bag-weight';

@Component({
  selector: 'app-bagweight',
  templateUrl: './bagweight.component.html',
  styleUrls: ['./bagweight.component.scss']
})
export class BagWeightComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'weight', 'bag1', 'bag2', 'bag3', 'bag4', 'lineID'];
  public dataSource = new MatTableDataSource<BagWeight>();

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
      this.getBagWeights();
    });
  }

  ngOnInit(): void {
    this.getBagWeights();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public getBagWeights() {
    this.repoService.getData('api/bag-weight-infos')
      .subscribe(
        (res) => {
          this.dataSource.data = res as BagWeight[];
          console.log(this.dataSource.data);
        },
        (err) => {
          console.error(err);
        }
      );
  }
  updateBagWeight(id: number) {
    this.dialog.open(UpdateBagWeightComponent, {
      width: '500px',
      height: '600px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteBagWeight(id: number) {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this bag weight?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/bag-weight-infos/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService.openSuccessDialog("The bag weight has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getBagWeights();
                });
            },
            (err) => {
              console.error(err);
            }
          );
        }
      });
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}