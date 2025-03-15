import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorDto, DistributorForUpdateDto } from 'src/app/_interface/distributor';
import { AreaDto } from 'src/app/_interface/area';

@Component({
  selector: 'app-update-distributor',
  templateUrl: './update-distributor.component.html'
})
export class UpdateDistributorComponent implements OnInit {
  dataForm!: FormGroup;
  distributor!: DistributorDto;
  areas: AreaDto[] = [];

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
      contactSource: new FormControl('', [Validators.maxLength(100)]),
      phoneNumber: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      areaId: new FormControl(null, [Validators.required]),
      isActive: new FormControl(true)
    });

    this.getAreas();
    this.getDistributorToUpdate();
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
    let data: DistributorForUpdateDto = {
      distributorCode: dataFormValue.distributorCode,
      distributorName: dataFormValue.distributorName,
      address: dataFormValue.address,
      contactSource: dataFormValue.contactSource,
      phoneNumber: dataFormValue.phoneNumber,
      areaId: dataFormValue.areaId,
      isActive: dataFormValue.isActive
    };

    const uri: string = `api/distributors/${this.data.id}`;
    this.repoService.update(uri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The distributor has been updated successfully.")
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

  private getDistributorToUpdate = () => {
    const uri: string = `api/distributors/${this.data.id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (distributor: any) => {
          this.distributor = { ...distributor };
          this.dataForm.patchValue({
            distributorCode: this.distributor.distributorCode,
            distributorName: this.distributor.distributorName,
            address: this.distributor.address,
            contactSource: this.distributor.contactSource,
            phoneNumber: this.distributor.phoneNumber,
            areaId: this.distributor.areaId,
            isActive: this.distributor.isActive
          });
        },
        error: (err) => {
          this.toastr.error(err);
        }
      });
  };

  public getAreas() {
    this.repoService.getData('api/areas')
      .subscribe(
        (res) => {
          this.areas = res as AreaDto[];
        },
        (err) => {
          this.toastr.error(err);
        }
      );
  }

  closeModal() {
    this.dialogRef.close();
  }
}