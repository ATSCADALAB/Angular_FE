import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { ProductInformationForCreationDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-add-product-information',
  templateUrl: './add-product-information.component.html'
})
export class AddProductInformationComponent implements OnInit {
  dataForm!: FormGroup;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddProductInformationComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      productCode: new FormControl('', [Validators.required]),
      productName: new FormControl('', [Validators.required]),
      unit: new FormControl('', [Validators.required]),
      weightPerUnit: new FormControl(0, [Validators.required, Validators.min(0)]),
      isActive: new FormControl(true)
    });
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
    let data: ProductInformationForCreationDto = {
      productCode: dataFormValue.productCode,
      productName: dataFormValue.productName,
      unit: dataFormValue.unit,
      weightPerUnit: dataFormValue.weightPerUnit,
      isActive: dataFormValue.isActive
    };

    const apiUri: string = `api/product-informations`;
    this.repoService.create(apiUri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The product information has been added successfully.")
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

  closeModal() {
    this.dialogRef.close();
  }
}