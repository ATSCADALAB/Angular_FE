import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { OrderDetailDto } from 'src/app/_interface/order-detail';

@Component({
  selector: 'app-order-detail-confirm',
  templateUrl: './order-detail-confirm.component.html',
  styleUrls: ['./order-detail-confirm.component.scss']
})
export class OrderDetailConfirmComponent implements OnInit {
  confirmMessage: string | null = null;
  dataForm!: FormGroup;
  orderDetail: OrderDetailDto;
  totalUnits: number;
  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OrderDetailConfirmComponent>
  ) {
    this.totalUnits = data.totalUnits;
  }

  ngOnInit() {

    this.dataForm = new FormGroup({
      defectiveUnits: new FormControl(0, [Validators.required, Validators.min(0)]),
      replaceUnits: new FormControl({ value: '', disabled: true }, [
        Validators.required,
        Validators.min(0),
      ]),
    });
    // Khi người dùng nhập số lượng lỗi
    this.dataForm.get('defectiveUnits')?.valueChanges.subscribe(value => {
      const replaceUnitsControl = this.dataForm.get('replaceUnits');
      if (value && value > 0) {
        replaceUnitsControl?.enable();
      } else {
        replaceUnitsControl?.disable();
        replaceUnitsControl?.setValue('');
      }
    });

    // Kiểm tra khi nhập số lượng bổ sung
    this.dataForm.get('replaceUnits')?.valueChanges.subscribe(value => {
      const defectiveValue = this.dataForm.get('defectiveUnits')?.value;
      if (value && defectiveValue && (value < defectiveValue || value > defectiveValue)) {
        this.confirmMessage = `The number replace unit(s) does not equal the defective unit(s). Are you sure?`;
      } else {
        this.confirmMessage = null; // Ẩn thông báo nếu hợp lệ
      }
    });
    this.getOrderDetailToAddReplace();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName);
  }

  public createData = (dataFormValue: any) => {
    if (this.dataForm.valid) {
      this.executeDataCreation(dataFormValue);
    }
  };

  private executeDataCreation = (dataFormValue: any) => {
    this.orderDetail.replacedUnits = dataFormValue.replaceUnits;
    this.orderDetail.defectiveUnits = dataFormValue.defectiveUnits;
    console.log('Order detail trước khi update:', this.orderDetail);

    this.repoService.updateByID('api/order-details', this.data.id, this.orderDetail).subscribe(
      (res) => {
        if (res === null || res === undefined) {
          console.log('Update response:', res);
          this.dialogService.openSuccessDialog("Update successfully.")
            .afterClosed()
            .subscribe(() => {
              this.dataService.triggerRefreshTab1();
              this.dialogRef.close(true); // Trả về true để gọi các hàm updateOrderDetail và updateOrderStatus
            });
        } else {
          console.log('Update response is null or undefined');
        }
      },
      (error) => {
        console.log('Update error:', error);
        this.dialogService.openErrorDialog(error.message)
          .afterClosed()
          .subscribe(() => {
            this.dialogRef.close();
          });
      }
    );
  };

  private getOrderDetailToAddReplace = () => {
    if (this.data.id) {
      this.repoService.getData(`api/order-details/${this.data.id}`).subscribe(
        (res) => {
          this.orderDetail = res as OrderDetailDto;
          console.log('Order detail:', this.orderDetail);
        },
        (err) => {
          console.log('Error loading order detail:', err);
          this.orderDetail = null!;
        }
      );
    } else {
      console.log('No order detail id found.');
      this.orderDetail = null!;
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}