import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { AreaDto, AreaForUpdateDto } from 'src/app/_interface/area';

@Component({
  selector: 'app-update-area',
  templateUrl: './update-area.component.html'
})
export class UpdateAreaComponent implements OnInit {
  dataForm!: FormGroup;
  area!: AreaDto;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateAreaComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      areaCode: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      areaName: new FormControl('', [Validators.required, Validators.maxLength(100)])
    });

    this.getAreaToUpdate();
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
    let data: AreaForUpdateDto = {
      areaCode: dataFormValue.areaCode,
      areaName: dataFormValue.areaName
    };

    const uri: string = `api/areas/${this.data.id}`;
    this.repoService.update(uri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The area has been updated successfully.")
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

  private getAreaToUpdate = () => {
    const uri: string = `api/areas/${this.data.id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (area: any) => {
          this.area = { ...area };
          this.dataForm.patchValue({
            areaCode: this.area.areaCode,
            areaName: this.area.areaName
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