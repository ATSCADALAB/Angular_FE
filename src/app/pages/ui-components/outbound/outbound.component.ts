import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { OutboundRecordDto } from 'src/app/_interface/stock';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { AddOutboundComponent } from './add-outbound/add-outbound.component';

@Component({
  selector: 'app-outbound',
  templateUrl: './outbound.component.html',
  styleUrls: ['./outbound.component.scss']
})
export class OutboundComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['productName', 'quantityUnits', 'quantityWeight', 'outboundDate', 'createdAt'];
  dataSource = new MatTableDataSource<OutboundRecordDto>();

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
      this.getOutboundRecords();
    });
  }

  ngOnInit(): void {
    this.getOutboundRecords();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getOutboundRecords() {
    this.repoService.getData('api/outbound-records')
      .subscribe(
        (res) => {
          this.dataSource.data = res as OutboundRecordDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addOutbound() {
    this.dialog.open(AddOutboundComponent, {
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