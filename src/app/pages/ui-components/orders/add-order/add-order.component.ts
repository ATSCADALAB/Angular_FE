import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { OrderForCreationDto } from 'src/app/_interface/order';

@Component({
  selector: 'app-add-order',
  templateUrl: './add-order.component.html'
})
export class AddOrderComponent implements OnInit {
  dataForm: FormGroup | any;
  distributors: DistributorDto[] | any;
  productInformations: ProductInformationDto[] | any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddOrderComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      code: new FormControl('', [Validators.required, Validators.maxLength(50)]), // Số Phiếu XK
      exportDate: new FormControl(new Date(), [Validators.required]), // Ngày xuất
      quantityVehicle: new FormControl(0, [Validators.required, Validators.min(0)]), // Số tài xế
      vehicleNumber: new FormControl('', [Validators.required, Validators.maxLength(20)]), // Biển số xe
      containerNumber: new FormControl(0, [Validators.min(0)]), // Số Cont
      sealNumber: new FormControl(0, [Validators.min(0)]), // Số Seal
      driverName: new FormControl('', [Validators.required, Validators.maxLength(100)]), // Tên TX
      driverPhoneNumber: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{10}$')]), // SĐT TX
      unitOrder: new FormControl('', [Validators.required, Validators.maxLength(20)]), // Số lượng (Bao)
      weightOrder: new FormControl(0, [Validators.required, Validators.min(0)]), // Số Lượng (Kg)
      manufactureDate: new FormControl(new Date(), [Validators.required]), // Ngày sản xuất
      distributorId: new FormControl(null, [Validators.required]), // Distributor
      productInformationId: new FormControl(null, [Validators.required]) // Product Information
    });

    this.getDistributors();
    this.getProductInformations();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched;
  };

  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName);
  };

  public createData = (dataFormValue: any) => {
    if (this.dataForm.valid) {
      this.executeDataCreation(dataFormValue);
    }
  };

  private executeDataCreation = (dataFormValue: any) => {
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
      status: 0
    };

    const apiUri: string = `api/orders`;
    this.repoService.create(apiUri, data).subscribe(
      (res: any) => {
        this.dialogService
          .openSuccessDialog('The order has been added successfully.')
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close([]);
          });
      },
      (error) => {
        this.dialogService
          .openErrorDialog(error.message)
          .afterClosed()
          .subscribe(() => {
            this.dialogRef.close([]);
          });
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
}