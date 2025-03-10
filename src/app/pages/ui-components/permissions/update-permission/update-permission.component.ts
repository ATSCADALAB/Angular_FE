import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { PermissionForCreationDto, PermissionDto } from 'src/app/_interface/permission';
import { DataService } from 'src/app/shared/services/data.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { ErrorHandlerService } from 'src/app/shared/services/error-handler.service';
import { RepositoryService } from 'src/app/shared/services/repository.service';

@Component({
  selector: 'app-update-permission',
  templateUrl: './update-permission.component.html',
})
export class UpdatePermissionComponent implements OnInit {

  dataForm: FormGroup |any;
  role: PermissionDto |any;
  result: any;

  constructor( 
    private repoService: RepositoryService,
    private toastr: ToastrService,
    private dataService: DataService,
    private dialogserve: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private Ref: MatDialogRef<UpdatePermissionComponent>) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    });
    this.result = this.data;
    this.getRoletoUpdate();
  }

  public validateControl = (controlName: string) => {
    return this.dataForm?.get(controlName)?.invalid && this.dataForm?.get(controlName)?.touched
  }
  public hasError = (controlName: string, errorName: string) => {
    return this.dataForm?.get(controlName)?.hasError(errorName)
  }

  public createData = (dataFormValue: any) => {

    if (this.dataForm.valid) {
      this.executeDataCreation(dataFormValue);

    }
  };
  private executeDataCreation = (dataFormValue: any) => {
    let data: PermissionForCreationDto = {
   
      name: dataFormValue.name,

    };
    let id = this.result.id;
    const Uri: string = `api/permissions/${id}`;
    this.repoService.update(Uri, data).subscribe(
      (res) => {
        this.dialogserve.openSuccessDialog("The role has been updated successfully.")
        .afterClosed()
        .subscribe((res) => {
          this.dataService.triggerRefreshTab1();
          this.Ref.close([]);
        });
      },
      (error) => {
        this.toastr.error(error);
        this.Ref.close([]);
      }
    );
  };




  closeModal(){
    this.Ref.close([]);
  }

  private getRoletoUpdate = () => {
    let id = this.result.id;
    const Uri: string = `api/permissions/${id}`;
    console.log(Uri);
    this.repoService.getData(Uri)
    .subscribe({
      next: (own: PermissionDto|any) => {
        this.role = {...own};
        this.dataForm.patchValue(this.role);
      },
      error: (err) => {
        this.toastr.success(err);
      }
    })
  }
}
