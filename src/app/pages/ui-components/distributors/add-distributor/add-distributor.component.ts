import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { DistributorForCreationDto } from 'src/app/_interface/distributor';
import { AreaDto } from 'src/app/_interface/area';

@Component({
  selector: 'app-add-distributor',
  templateUrl: './add-distributor.component.html'
})
export class AddDistributorComponent implements OnInit {
  dataForm!: FormGroup;
  areas: AreaDto[] = [];

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
      //contactSource: new FormControl('', [Validators.maxLength(100)]),
      //phoneNumber: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      province: new FormControl(null, [Validators.required]),
      areaId: new FormControl(null, [Validators.required]),
      isActive: new FormControl(true)
    });

    this.getAreas();
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
      contactSource: dataFormValue.contactSource,
      phoneNumber: dataFormValue.phoneNumber,
      province: dataFormValue.province,
      areaId: dataFormValue.areaId,
      isActive: dataFormValue.isActive
    };

    const apiUri: string = `api/distributors`;
    this.repoService.create(apiUri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The distributor has been added successfully.")
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