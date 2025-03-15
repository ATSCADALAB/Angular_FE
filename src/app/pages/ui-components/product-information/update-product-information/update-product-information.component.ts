import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductInformationDto, ProductInformationForUpdateDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-update-product-information',
  templateUrl: './update-product-information.component.html'
})
export class UpdateProductInformationComponent implements OnInit {
  dataForm!: FormGroup;
  product!: ProductInformationDto;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private dialogRef: MatDialogRef<UpdateProductInformationComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      productCode: new FormControl('', [Validators.required]),
      productName: new FormControl('', [Validators.required]),
      unit: new FormControl('', [Validators.required]),
      weightPerUnit: new FormControl(0, [Validators.required, Validators.min(0)]),
      isActive: new FormControl(true)
    });

    this.getProductToUpdate();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName);
  }

  public updateData = (dataFormValue: any) => {
    if (this.dataForm.valid) {
      this.executeDataUpdate(dataFormValue);
    }
  };

  private executeDataUpdate = (dataFormValue: any) => {
    let data: ProductInformationForUpdateDto = {
      productCode: dataFormValue.productCode,
      productName: dataFormValue.productName,
      unit: dataFormValue.unit,
      weightPerUnit: dataFormValue.weightPerUnit,
      isActive: dataFormValue.isActive
    };

    const uri: string = `api/product-informations/${this.data.id}`;
    this.repoService.update(uri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The product information has been updated successfully.")
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close();
          });
      },
      (error) => {
        this.toastr.error(error);
        this.dialogRef.close();
      }
    );
  };

  private getProductToUpdate = () => {
    const uri: string = `api/product-informations/${this.data.id}`;
    this.repoService.getData(uri).subscribe({
      next: (product: any) => {
        this.product = { ...product };
        this.dataForm.patchValue({
          productCode: this.product.productCode,
          productName: this.product.productName,
          unit: this.product.unit,
          weightPerUnit: this.product.weightPerUnit,
          isActive: this.product.isActive
        });
      },
      error: (err) => {
        this.toastr.error(err);
      }
    });
  };

  closeModal() {
    this.dialogRef.close();
  }
}