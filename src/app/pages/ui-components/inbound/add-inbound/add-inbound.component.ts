import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { InboundRecordForCreationDto } from 'src/app/_interface/stock';
import { ProductInformationDto } from 'src/app/_interface/product-information';

@Component({
  selector: 'app-add-inbound',
  templateUrl: './add-inbound.component.html'
})
export class AddInboundComponent implements OnInit {
  inboundForm!: FormGroup;
  products: ProductInformationDto[] = [];

  constructor(
    private repoService: RepositoryService,
    private dataService: DataService,
    private toastr: ToastrService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<AddInboundComponent>
  ) {}

  ngOnInit() {
    this.inboundForm = new FormGroup({
      productInformationId: new FormControl('', [Validators.required]),
      quantityUnits: new FormControl('', [Validators.required, Validators.min(1)]),
      quantityWeight: new FormControl({ value: '', disabled: true }), // Weight is calculated automatically
      inboundDate: new FormControl(new Date(), [Validators.required])
    });

    this.loadProducts();

    this.inboundForm.get('productInformationId')?.valueChanges.subscribe(() => this.calculateWeight());
    this.inboundForm.get('quantityUnits')?.valueChanges.subscribe(() => this.calculateWeight());
  }

  loadProducts() {
    this.repoService.getData<ProductInformationDto[]>('api/product-informations')
      .subscribe(
        (res) => {
          this.products = res;
        },
        (err) => {
          this.toastr.error('Failed to load product list!');
          console.log(err);
        }
      );
  }

  calculateWeight() {
    const productId = this.inboundForm.get('productInformationId')?.value;
    const quantityUnits = this.inboundForm.get('quantityUnits')?.value;

    if (productId && quantityUnits) {
      const selectedProduct = this.products.find(p => p.id === productId);
      if (selectedProduct) {
        const weight = quantityUnits * selectedProduct.weightPerUnit;
        this.inboundForm.get('quantityWeight')?.setValue(weight);
      }
    } else {
      this.inboundForm.get('quantityWeight')?.setValue('');
    }
  }

  public validateControl = (controlName: string) => {
    return this.inboundForm?.get(controlName)?.invalid && this.inboundForm?.get(controlName)?.touched;
  }

  public hasError = (controlName: string, errorName: string) => {
    return this.inboundForm?.get(controlName)?.hasError(errorName);
  }

  public createInbound = () => { // No need to pass formValue anymore
    if (this.inboundForm.valid) {
      this.executeInboundCreation();
    }
  };

  private executeInboundCreation = () => {
    let inbound: InboundRecordForCreationDto = {
      productInformationId: this.inboundForm.get('productInformationId')?.value,
      quantityUnits: this.inboundForm.get('quantityUnits')?.value,
      quantityWeight: this.inboundForm.get('quantityWeight')?.value, // Get directly from form control
      inboundDate: this.inboundForm.get('inboundDate')?.value
    };

    const apiUri: string = `api/inbound-records`;
    this.repoService.create(apiUri, inbound).subscribe(
      () => {
        this.dialogService.openSuccessDialog("Inbound record has been added successfully.")
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