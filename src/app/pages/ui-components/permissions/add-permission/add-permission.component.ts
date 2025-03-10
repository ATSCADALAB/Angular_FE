import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { PermissionForCreationDto } from 'src/app/_interface/permission';
import { DataService } from 'src/app/shared/services/data.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { ErrorHandlerService } from 'src/app/shared/services/error-handler.service';
import { RepositoryService } from 'src/app/shared/services/repository.service';

@Component({
  selector: 'app-add-permission',
  templateUrl: './add-permission.component.html',
})
export class AddPermissionComponent implements OnInit {
  dataForm: FormGroup |any;

  constructor( 
    private repoService: RepositoryService,
    private toastr: ToastrService,
    private dataService: DataService,
    private dialogserve: DialogService,
    private Ref: MatDialogRef<AddPermissionComponent>) {}

  ngOnInit() {
    this.dataForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    });

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
    const apiUri: string = `api/permissions`;
    this.repoService.create(apiUri, data).subscribe(
      (res) => {
        this.dialogserve.openSuccessDialog("The role has been added successfully.")
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

}
