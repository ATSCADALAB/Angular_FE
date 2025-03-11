import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { ProductForUpdateDto } from 'src/app/_interface/product';

@Component({
  selector: 'app-update-product',
  templateUrl: './update-product.component.html'
})
export class UpdateProductComponent implements OnInit {
  dataForm: FormGroup | any;
  distributors: DistributorDto[] | any;
  productInformations: ProductInformationDto[] | any;
  product: ProductForUpdateDto | any;
  result: any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateProductComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      tagID: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      shipmentDate: new FormControl(new Date(), [Validators.required]),
      productDate: new FormControl(new Date(), [Validators.required]),
      delivery: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      stockOut: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      isActive: new FormControl(true),
      distributorId: new FormControl(null, [Validators.required]),
      productInformationId: new FormControl(null, [Validators.required])
    });

    this.getDistributors();
    this.getProductInformations();

    this.result = this.data;
    this.getProductToUpdate();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName);
  }

  public createData = (dataFormValue: any) => {
    if (this.dataForm.valid) {
      this.executeDataUpdate(dataFormValue);
    }
  };

  private executeDataUpdate = (dataFormValue: any) => {
    let data: ProductForUpdateDto = {
      tagID: dataFormValue.tagID,
      shipmentDate: dataFormValue.shipmentDate,
      productDate: dataFormValue.productDate,
      delivery: dataFormValue.delivery,
      stockOut: dataFormValue.stockOut,
      isActive: true,
      distributorId: dataFormValue.distributorId,
      productInformationId: dataFormValue.productInformationId
    };

    let id = this.result.id;
    const uri: string = `api/products/${id}`;
    this.repoService.update(uri, data).subscribe(
      (res) => {
        this.dialogService.openSuccessDialog("The product has been updated successfully.")
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
    this.repoService.getData('api/distributors')
      .subscribe(
        (res) => {
          this.distributors = res as DistributorDto[];
        },
        (err) => {
          this.toastr.error(err);
        }
      );
  }

  public getProductInformations() {
    this.repoService.getData('api/productInformations')
      .subscribe(
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

  private getProductToUpdate = () => {
    let id = this.result.id;
    const uri: string = `api/products/${id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (prod: any) => {
          this.product = { ...prod };
          this.dataForm.patchValue({
            tagID: this.product.tagID,
            shipmentDate: this.product.shipmentDate,
            productDate: this.product.productDate,
            delivery: this.product.delivery,
            stockOut: this.product.stockOut,
            isActive: true,
            distributorId: this.product.distributorId,
            productInformationId: this.product.productInformationId
          });
        },
        error: (err) => {
          this.toastr.error(err);
        }
      });
  };
}