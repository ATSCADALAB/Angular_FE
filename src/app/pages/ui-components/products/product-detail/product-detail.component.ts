import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductDto } from 'src/app/_interface/product';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'] 
})
export class ProductDetailComponent {
  product: ProductDto;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ProductDetailComponent>
  ) {
    this.product = data.product; // Nhận dữ liệu sản phẩm từ dữ liệu truyền vào
  }

  closeModal() {
    this.dialogRef.close([]);
  }
}