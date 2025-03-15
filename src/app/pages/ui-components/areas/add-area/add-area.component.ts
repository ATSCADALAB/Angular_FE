import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { AreaForCreationDto } from 'src/app/_interface/area';

@Component({
  selector: 'app-add-area',
  templateUrl: './add-area.component.html'
})
export class AddAreaComponent implements OnInit {
  dataForm!: FormGroup;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddAreaComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      areaCode: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      areaName: new FormControl('', [Validators.required, Validators.maxLength(100)])
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
    let data: AreaForCreationDto = {
      areaCode: dataFormValue.areaCode,
      areaName: dataFormValue.areaName
    };

    const apiUri: string = `api/areas`;
    this.repoService.create(apiUri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The area has been added successfully.")
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