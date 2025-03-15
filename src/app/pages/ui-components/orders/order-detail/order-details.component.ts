import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { OrderDto, OrderLineDetailCreationDto, OrderLineDetailDto } from 'src/app/_interface/order';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  orderId: string | null = null;
  order: OrderDto | null = null;
  selectedLine: number | null = null;
  lines: number[] = [1, 2, 3, 4];
  isStarting: boolean = false;
  orderLineDetails: OrderLineDetailDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      // Load thông tin Order
      this.repoService.getData(`api/orders/${this.orderId}`).subscribe(
        (res) => {
          this.order = res as OrderDto;
        },
        (err) => {
          console.log(err);
        }
      );

      // Load OrderLineDetail
      this.loadOrderLineDetails();
    }
  }

  // Hàm load OrderLineDetail
  loadOrderLineDetails(): void {
    if (this.orderId) {
      this.repoService.getData(`api/OrderLineDetails/${this.orderId}`).subscribe(
        (res) => {
          this.orderLineDetails = res as OrderLineDetailDto;
          console.log('Order line details:', this.orderLineDetails);
          if (this.orderLineDetails) {
            this.selectedLine = this.orderLineDetails.line;
          }
        },
        (err) => {
          console.log('Error loading order line details:', err);
          this.orderLineDetails = null;
        }
      );
    }
  }

  // Kiểm tra xem Order đã được gán Line chưa
  hasAssignedLine(): boolean {
    return this.orderLineDetails !== null;
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Not Completed';
      case 1:
        return 'In Progress';
      case 2:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0:
        return 'status-not-completed';
      case 1:
        return 'status-in-progress';
      case 2:
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  startOrder(): void {
    if (!this.selectedLine) {
      this.snackBar.open('Please select a Line before starting.', 'Close', { duration: 3000 });
      return;
    }

    if (this.order && this.orderId) {
      this.isStarting = true;
      const orderLineDetailData: OrderLineDetailCreationDto = {
        OrderId: this.orderId,
        Line: this.selectedLine
      };

      this.repoService.create('api/OrderLineDetails', orderLineDetailData).subscribe(
        (res) => {
          this.isStarting = false;
          this.snackBar.open('Order started successfully.', 'Close', { duration: 3000 });
          this.ngOnInit();
        },
        (err) => {
          this.isStarting = false;
          this.snackBar.open('Failed to start order.', 'Close', { duration: 3000 });
          console.log(err);
        }
      );
    }
  }
}