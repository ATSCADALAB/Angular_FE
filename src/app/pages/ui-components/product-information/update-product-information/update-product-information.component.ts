import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductInformationForUpdateDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-update-product-information',
  templateUrl: './update-product-information.component.html'
})
export class UpdateProductInformationComponent implements OnInit {
  dataForm: FormGroup | any;
  productInformation: ProductInformationForUpdateDto | any;
  result: any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateProductInformationComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      productCode: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      productName: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      unit: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      weight: new FormControl(0, [Validators.required, Validators.min(0)]),
      isActive: new FormControl(true)
    });

    this.result = this.data;
    this.getProductInformationToUpdate();
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
    let data: ProductInformationForUpdateDto = {
      productCode: dataFormValue.productCode,
      productName: dataFormValue.productName,
      unit: dataFormValue.unit,
      weight: dataFormValue.weight,
      isActive: true
    };

    let id = this.result.id;
    const uri: string = `api/productInformations/${id}`;
    this.repoService.update(uri, data).subscribe(
      (res) => {
        this.dialogService.openSuccessDialog("The product information has been updated successfully.")
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

  closeModal() {
    this.dialogRef.close([]);
  }

  private getProductInformationToUpdate = () => {
    let id = this.result.id;
    const uri: string = `api/productInformations/${id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (prodInfo: any) => {
          this.productInformation = { ...prodInfo };
          this.dataForm.patchValue({
            productCode: this.productInformation.productCode,
            productName: this.productInformation.productName,
            unit: this.productInformation.unit,
            weight: this.productInformation.weight,
            isActive: this.productInformation.isActive
          });
        },
        error: (err) => {
          this.toastr.error(err);
        }
      });
  };
}