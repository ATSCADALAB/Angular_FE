import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { OrderDto, OrderLineDetailCreationDto } from 'src/app/_interface/order';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  orderId: string | null = null;
  order: OrderDto | null = null;
  selectedLine: number | null = null; // Biến lưu giá trị Line được chọn
  lines: number[] = [1, 2, 3, 4]; // Danh sách Line từ 1 đến 4
  isStarting: boolean = false; // Trạng thái khi đang gọi API

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repoService: RepositoryService,
    private snackBar: MatSnackBar // Thêm MatSnackBar để hiển thị thông báo
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.repoService.getData(`api/orders/${this.orderId}`).subscribe(
        (res) => {
          this.order = res as OrderDto;
        },
        (err) => {
          console.log(err);
        }
      );
    }
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
        OrderId: this.orderId!,
        Line: this.selectedLine!
      };

      this.repoService.create('api/OrderLineDetails', orderLineDetailData).subscribe(
        (res) => {
          this.isStarting = false;
          this.snackBar.open('Order started successfully.', 'Close', { duration: 3000 });
        },
        (err) => {
          this.isStarting = false;
          this.snackBar.open('Failed to start order.', 'Close', { duration: 3000 });
        }
      );
    }
  }
}