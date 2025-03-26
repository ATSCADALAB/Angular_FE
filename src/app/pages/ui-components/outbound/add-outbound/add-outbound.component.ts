import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { OutboundRecordForCreationDto } from 'src/app/_interface/stock';
import { ProductInformationDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-add-outbound',
  templateUrl: './add-outbound.component.html'
})
export class AddOutboundComponent implements OnInit {
  outboundForm!: FormGroup;
  products: ProductInformationDto[] = [];

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddOutboundComponent>
  ) {}

  ngOnInit() {
    this.outboundForm = new FormGroup({
      productInformationId: new FormControl('', [Validators.required]),
      quantityUnits: new FormControl('', [Validators.required, Validators.min(1)]),
      quantityWeight: new FormControl({ value: '', disabled: true }), // Weight is calculated automatically
      outboundDate: new FormControl(new Date(), [Validators.required])
    });

    this.loadProducts();

    this.outboundForm.get('productInformationId')?.valueChanges.subscribe(() => this.calculateWeight());
    this.outboundForm.get('quantityUnits')?.valueChanges.subscribe(() => this.calculateWeight());
  }

  loadProducts() {
    this.repoService.getData<ProductInformationDto[]>('api/product-informations')
      .subscribe(
        (res) => {
          this.products = res;
        },
        (err) => {
          console.log(err);
        }
      );
  }

  calculateWeight() {
    const productId = this.outboundForm.get('productInformationId')?.value;
    const quantityUnits = this.outboundForm.get('quantityUnits')?.value;

    if (productId && quantityUnits) {
      const selectedProduct = this.products.find(p => p.id === productId);
      if (selectedProduct) {
        const weight = quantityUnits * selectedProduct.weightPerUnit;
        this.outboundForm.get('quantityWeight')?.setValue(weight);
      }
    } else {
      this.outboundForm.get('quantityWeight')?.setValue('');
    }
  }

  public validateControl = (controlName: string) => {
    return this.outboundForm?.get(controlName)?.invalid && this.outboundForm?.get(controlName)?.touched;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.outboundForm?.get(controlName)?.hasError(errorName);
  }

  public createOutbound = () => { // No need to pass formValue
    if (this.outboundForm.valid) {
      this.executeOutboundCreation();
    }
  };

  private executeOutboundCreation = () => {
    let outbound: OutboundRecordForCreationDto = {
      productInformationId: this.outboundForm.get('productInformationId')?.value,
      quantityUnits: this.outboundForm.get('quantityUnits')?.value,
      quantityWeight: this.outboundForm.get('quantityWeight')?.value, // Get directly from form control
      outboundDate: this.outboundForm.get('outboundDate')?.value
    };

    const apiUri: string = `api/outbound-records`;
    this.repoService.create(apiUri, outbound).subscribe(
      () => {
        this.dialogService.openSuccessDialog("Outbound record has been added successfully.")
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