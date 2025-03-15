import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { LineDto, LineForUpdateDto } from 'src/app/_interface/line';

@Component({
  selector: 'app-update-line',
  templateUrl: './update-line.component.html'
})
export class UpdateLineComponent implements OnInit {
  dataForm!: FormGroup;
  line!: LineDto;

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateLineComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      lineNumber: new FormControl('', [Validators.required, Validators.min(1)]),
      lineName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      isActive: new FormControl(true)
    });

    this.getLineToUpdate();
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
    let data: LineForUpdateDto = {
      lineNumber: dataFormValue.lineNumber,
      lineName: dataFormValue.lineName,
      isActive: dataFormValue.isActive
    };

    const uri: string = `api/lines/${this.data.id}`;
    this.repoService.update(uri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The line has been updated successfully.")
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

  private getLineToUpdate = () => {
    const uri: string = `api/lines/${this.data.id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (line: any) => {
          this.line = { ...line };
          this.dataForm.patchValue({
            lineNumber: this.line.lineNumber,
            lineName: this.line.lineName,
            isActive: this.line.isActive
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