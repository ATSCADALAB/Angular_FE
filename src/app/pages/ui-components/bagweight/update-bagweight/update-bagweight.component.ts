import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { BagWeight, BagWeightForUpdateDto } from 'src/app/_interface/bag-weight';

@Component({
  selector: 'app-update-bagweight',
  templateUrl: './update-bagweight.component.html'
})
export class UpdateBagWeightComponent implements OnInit {
  dataForm!: FormGroup;
  bagWeight!: BagWeight;
  line!: number;
  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdateBagWeightComponent>
  ) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      weight: new FormControl('', [Validators.required, Validators.min(0)]),
      bag1: new FormControl('', [Validators.required, Validators.min(0)]),
      bag2: new FormControl('', [Validators.required, Validators.min(0)]),
      bag3: new FormControl('', [Validators.required, Validators.min(0)]),
      bag4: new FormControl('', [Validators.required, Validators.min(0)]),
    });

    this.getBagWeightToUpdate();
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
    let data: BagWeightForUpdateDto = {
      id: this.data.id,
      weight: dataFormValue.weight,
      bag1: dataFormValue.bag1,
      bag2: dataFormValue.bag2,
      bag3: dataFormValue.bag3,
      bag4: dataFormValue.bag4,
      lineID: this.line
    };

    const uri: string = `api/bag-weight-infos/${this.data.id}`;
    this.repoService.update(uri, data).subscribe(
      () => {
        this.dialogService.openSuccessDialog("The bag weight has been updated successfully.")
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

  private getBagWeightToUpdate = () => {
    const uri: string = `api/bag-weight-infos/${this.data.id}`;
    this.repoService.getData(uri)
      .subscribe({
        next: (bagWeight: any) => {
          this.bagWeight = { ...bagWeight };
          this.line=this.bagWeight.lineID;
          this.dataForm.patchValue({
            weight: this.bagWeight.weight,
            bag1: this.bagWeight.bag1,
            bag2: this.bagWeight.bag2,
            bag3: this.bagWeight.bag3,
            bag4: this.bagWeight.bag4,
            lineID: this.bagWeight.lineID
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