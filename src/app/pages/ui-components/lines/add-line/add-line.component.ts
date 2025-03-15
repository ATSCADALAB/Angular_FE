import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { LineForCreationDto } from 'src/app/_interface/line';

@Component({
  selector: 'app-add-line',
  templateUrl: './add-line.component.html'
})
export class AddLineComponent implements OnInit {
  dataForm!: FormGroup;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddLineComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      lineNumber: new FormControl('', [Validators.required, Validators.min(1)]),
      lineName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
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
    let data: LineForCreationDto = {
      lineNumber: dataFormValue.lineNumber,
      lineName: dataFormValue.lineName,
      isActive: dataFormValue.isActive
    };

    const apiUri: string = `api/lines`;
    this.repoService.create(apiUri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The line has been added successfully.")
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