import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DistributorForCreationDto } from 'src/app/_interface/distributor';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-add-distributor',
  templateUrl: './add-distributor.component.html'
})
export class AddDistributorComponent implements OnInit {
  dataForm: FormGroup | any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddDistributorComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      distributorCode: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      distributorName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      address: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      phoneNumber: new FormControl('', [Validators.required, Validators.maxLength(20), Validators.pattern(/^\+?\d{10,20}$/)]),
      contactSource: new FormControl('', [Validators.maxLength(100)]),
      area: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      note: new FormControl('', [Validators.maxLength(500)]),
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
    let data: DistributorForCreationDto = {
      distributorCode: dataFormValue.distributorCode,
      distributorName: dataFormValue.distributorName,
      address: dataFormValue.address,
      phoneNumber: dataFormValue.phoneNumber,
      contactSource: dataFormValue.contactSource,
      area: dataFormValue.area,
      note: dataFormValue.note,
      isActive: true
    };

    const apiUri: string = `api/distributors`;
    this.repoService.create(apiUri, data).subscribe({
      next: () => {
        this.dialogService.openSuccessDialog('The distributor has been added successfully.')
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close([]);
          });
      },
      error: (error) => {
        this.dialogService.openErrorDialog(error.message)
          .afterClosed()
          .subscribe(() => {
            this.dialogRef.close([]);
          });
      }
    });
  };

  closeModal() {
    this.dialogRef.close([]);
  }
}