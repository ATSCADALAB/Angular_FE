import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { InboundRecordDto } from 'src/app/_interface/stock';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { AddInboundComponent } from './add-inbound/add-inbound.component';

@Component({
  selector: 'app-inbound',
  templateUrl: './inbound.component.html',
  styleUrls: ['./inbound.component.scss']
})
export class InboundComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['productName', 'quantityUnits', 'quantityWeight', 'inboundDate', 'createdAt'];
  dataSource = new MatTableDataSource<InboundRecordDto>();

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
      this.getInboundRecords();
    });
  }

  ngOnInit(): void {
    this.getInboundRecords();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getInboundRecords() {
    this.repoService.getData('api/inbound-records')
      .subscribe(
        (res) => {
          this.dataSource.data = res as InboundRecordDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addInbound() {
    this.dialog.open(AddInboundComponent, {
      width: '500px',
      height: '450px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}