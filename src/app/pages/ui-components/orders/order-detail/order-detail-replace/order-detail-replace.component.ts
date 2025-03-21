import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { LineForCreationDto } from 'src/app/_interface/line';
import { OrderDetailDto, OrderDetailUpdatenDto, OrderLineDetailDto } from 'src/app/_interface/order-detail';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-order-detail-replace',
  templateUrl: './order-detail-replace.component.html'
})
export class OrderDetailReplaceComponent implements OnInit {
  dataForm!: FormGroup;
  orderDetail: OrderDetailDto;
  orderDetailId: string | null = null;
  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OrderDetailReplaceComponent>
  ) { }

  ngOnInit() {
    this.dataForm = new FormGroup({
      replaceUnits: new FormControl('', [Validators.required, Validators.min(1)]),
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
    this.orderDetail.defectiveUnits = this.orderDetail.defectiveUnits + this.orderDetail.replacedUnits;
    console.log('Order detail:', this.orderDetail);
    this.repoService.updateByID('api/order-details',this.data.id, this.orderDetail).subscribe(
      () => {
        this.dialogService.openSuccessDialog("Update successfully.")
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close();
          });
      },
      (error) => {
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
    }
    else {
      console.log('No order detail id found.');
      this.orderDetail = null!;
    }
  }
  closeModal() {
    this.dialogRef.close();
  }
}