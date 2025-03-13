import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { OrderDto, OrderForCreationDto } from 'src/app/_interface/order';

@Component({
  selector: 'app-update-order',
  templateUrl: './update-order.component.html'
})
export class UpdateOrderComponent implements OnInit {
  dataForm: FormGroup | any;
  distributors: DistributorDto[] | any;
  productInformations: ProductInformationDto[] | any;
  order: OrderDto | any;
  result: any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateOrderComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      code: new FormControl('', [Validators.required, Validators.maxLength(50)]), // Order Code
      exportDate: new FormControl(new Date(), [Validators.required]), // Export Date
      quantityVehicle: new FormControl(0, [Validators.required, Validators.min(0)]), // Driver Count
      vehicleNumber: new FormControl('', [Validators.required, Validators.maxLength(20)]), // Vehicle Number
      containerNumber: new FormControl(0, [Validators.min(0)]), // Container Number
      sealNumber: new FormControl(0, [Validators.min(0)]), // Seal Number
      driverName: new FormControl('', [Validators.required, Validators.maxLength(100)]), // Driver Name
      driverPhoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]), // Driver Phone Number
      unitOrder: new FormControl('', [Validators.required, Validators.maxLength(20)]), // Quantity (bags)
      weightOrder: new FormControl(0, [Validators.required, Validators.min(0)]), // Weight (kg)
      manufactureDate: new FormControl(new Date(), [Validators.required]), // Manufacture Date
      distributorId: new FormControl(null, [Validators.required]), // Distributor
      productInformationId: new FormControl(null, [Validators.required]), // Product Information
      status: new FormControl(0, [Validators.required]) // Status
    });

    this.getDistributors();
    this.getProductInformations();

    this.result = this.data;
    this.getOrderToUpdate();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched;
  };

  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName);
  };

  public createData = (dataFormValue: any) => {
    if (this.dataForm.valid) {
      this.executeDataUpdate(dataFormValue);
    }
  };

  private executeDataUpdate = (dataFormValue: any) => {
    let data: OrderForCreationDto = {
      code: dataFormValue.code,
      exportDate: dataFormValue.exportDate,
      quantityVehicle: dataFormValue.quantityVehicle,
      vehicleNumber: dataFormValue.vehicleNumber,
      containerNumber: dataFormValue.containerNumber,
      sealNumber: dataFormValue.sealNumber,
      driverName: dataFormValue.driverName,
      driverPhoneNumber: dataFormValue.driverPhoneNumber,
      unitOrder: dataFormValue.unitOrder,
      weightOrder: dataFormValue.weightOrder,
      manufactureDate: dataFormValue.manufactureDate,
      distributorId: dataFormValue.distributorId,
      productInformationId: dataFormValue.productInformationId,
      status: dataFormValue.status
    };

    let id = this.result.id;
    const uri: string = `api/orders/${id}`;
    this.repoService.update(uri, data).subscribe(
      (res) => {
        this.dialogService
          .openSuccessDialog('The order has been updated successfully.')
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close([]);
          });
      },
      (error) => {
        this.toastr.error(error);
        this.dialogRef.close([]);
      }
    );
  };

  public getDistributors() {
    this.repoService.getData('api/distributors').subscribe(
      (res) => {
        this.distributors = res as DistributorDto[];
      },
      (err) => {
        this.toastr.error(err);
      }
    );
  }

  public getProductInformations() {
    this.repoService.getData('api/productInformations').subscribe(
      (res) => {
        this.productInformations = res as ProductInformationDto[];
      },
      (err) => {
        this.toastr.error(err);
      }
    );
  }

  closeModal() {
    this.dialogRef.close([]);
  }

  private getOrderToUpdate = () => {
    let id = this.result.id;
    const uri: string = `api/orders/${id}`;
    this.repoService.getData(uri).subscribe({
      next: (order: any) => {
        this.order = { ...order };
        this.dataForm.patchValue({
          code: this.order.code,
          exportDate: new Date(this.order.exportDate),
          quantityVehicle: this.order.quantityVehicle,
          vehicleNumber: this.order.vehicleNumber,
          containerNumber: this.order.containerNumber,
          sealNumber: this.order.sealNumber,
          driverName: this.order.driverName,
          driverPhoneNumber: this.order.driverPhoneNumber,
          unitOrder: this.order.unitOrder,
          weightOrder: this.order.weightOrder,
          manufactureDate: new Date(this.order.manufactureDate),
          distributorId: this.order.distributorId,
          productInformationId: this.order.productInformationId,
          status: this.order.status
        });
      },
      error: (err) => {
        this.toastr.error(err);
      }
    });
  };
}