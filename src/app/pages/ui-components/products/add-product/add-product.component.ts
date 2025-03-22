import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorDto } from 'src/app/_interface/distributor';
import { ProductInformationDto } from 'src/app/_interface/product-information';
import { ProductForCreationDto } from 'src/app/_interface/product';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html'
})
export class AddProductComponent implements OnInit {
  dataForm: FormGroup | any;
  distributors: DistributorDto[] | any;
  productInformations: ProductInformationDto[] | any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddProductComponent>
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
    let data: ProductForCreationDto = {
      tagID: dataFormValue.tagID,
      shipmentDate: dataFormValue.shipmentDate,
      productDate: dataFormValue.productDate,
      delivery: dataFormValue.delivery,
      stockOut: dataFormValue.stockOut,
      isActive: true,
      distributorId: dataFormValue.distributorId,
      productInformationId: dataFormValue.productInformationId
    };

    const apiUri: string = `api/products`;
    this.repoService.create(apiUri, data).subscribe(
      (res: any) => {
        this.dialogService.openSuccessDialog("The product has been added successfully.")
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close([]);
          });
      },
      (error) => {
        this.dialogService.openErrorDialog(error.message)
          .afterClosed()
          .subscribe(() => {
            this.dialogRef.close([]);
          });
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
    this.repoService.getData('api/product-informations')
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
}