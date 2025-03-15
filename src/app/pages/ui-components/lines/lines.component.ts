import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { LineDto } from 'src/app/_interface/line';
import { AddLineComponent } from './add-line/add-line.component';
import { UpdateLineComponent } from './update-line/update-line.component';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-lines',
  templateUrl: './lines.component.html',
  styleUrls: ['./lines.component.scss']
})
export class LinesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'lineNumber', 'lineName', 'isActive', 'createdAt', 'updatedAt'];
  public dataSource = new MatTableDataSource<LineDto>();

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
      this.getLines();
    });
  }

  ngOnInit(): void {
    this.getLines();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public getLines() {
    this.repoService.getData('api/lines')
      .subscribe(
        (res) => {
          this.dataSource.data = res as LineDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addLine() {
    this.dialog.open(AddLineComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateLine(id: number) {
    this.dialog.open(UpdateLineComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteLine(id: number) {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this line?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/lines/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService.openSuccessDialog("The line has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getLines();
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