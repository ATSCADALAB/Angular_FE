import { Component, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

// Interface for grouped line data
export interface GroupedLineData {
  lineName: string;
  totalOrders: number;
  orders: {
    lineNumber: number;
    lineName: string;
    orderId: string;
    orderCode: string;
    productName: string;
    requestedUnits: number;
    distributorName: string;
  }[];
}

@Component({
  selector: 'app-line-details-dialog',
  templateUrl: './line-details-dialog.component.html',
  styleUrls: ['./line-details-dialog.component.scss']
})
export class LineDetailsDialogComponent {
  constructor(
    public dialog: MatDialog,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: GroupedLineData
  ) {}

  navigateToOrder(orderId: string) {
    this.router.navigate(['/ui-components/order-details', orderId]);
    this.dialog.closeAll();
  }
}