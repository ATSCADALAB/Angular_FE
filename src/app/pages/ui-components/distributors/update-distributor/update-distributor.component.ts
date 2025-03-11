import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DistributorDto, DistributorForUpdateDto } from 'src/app/_interface/distributor';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-update-distributor',
  templateUrl: './update-distributor.component.html'
})
export class UpdateDistributorComponent implements OnInit {
  dataForm: FormGroup | any;
  distributor: DistributorDto | any;
  result: any;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateDistributorComponent>
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

    this.result = this.data;
    this.getDistributorToUpdate();
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
    let data: DistributorForUpdateDto = {
      distributorCode: dataFormValue.distributorCode,
      distributorName: dataFormValue.distributorName,
      address: dataFormValue.address,
      phoneNumber: dataFormValue.phoneNumber,
      contactSource: dataFormValue.contactSource,
      area: dataFormValue.area,
      note: dataFormValue.note,
      isActive: true
    };

    let id = this.result.id;
    const Uri: string = `api/distributors/${id}`;
    this.repoService.update(Uri, data).subscribe({
      next: () => {
        this.dialogService.openSuccessDialog('The distributor has been updated successfully.')
          .afterClosed()
          .subscribe(() => {
            this.dataService.triggerRefreshTab1();
            this.dialogRef.close([]);
          });
      },
      error: (error) => {
        this.toastr.error(error);
        this.dialogRef.close([]);
      }
    });
  };

  private getDistributorToUpdate = () => {
    let id = this.result.id;
    const Uri: string = `api/distributors/${id}`;
    this.repoService.getData(Uri).subscribe({
      next: (dist: any) => {
        this.distributor = { ...dist };
        this.dataForm.patchValue(this.distributor);
      },
      error: (err) => {
        this.toastr.error(err);
      }
    });
  };

  closeModal() {
    this.dialogRef.close([]);
  }
}