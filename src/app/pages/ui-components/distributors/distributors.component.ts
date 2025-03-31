import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { DistributorDto } from 'src/app/_interface/distributor';
import { AddDistributorComponent } from './add-distributor/add-distributor.component';
import { UpdateDistributorComponent } from './update-distributor/update-distributor.component';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { DataService } from 'src/app/shared/services/data.service';
import { HttpClient } from '@angular/common/http'; // Thêm HttpClient

@Component({
  selector: 'app-distributors',
  templateUrl: './distributors.component.html',
  styleUrls: ['./distributors.component.scss']
})
export class DistributorsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['action', 'distributorCode', 'distributorName','province', 'area', 'isActive', 'createdAt', 'updatedAt'];
  public dataSource = new MatTableDataSource<DistributorDto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef; // Tham chiếu đến input file
  private refreshSubscription!: Subscription;

  constructor(
    private repoService: RepositoryService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private dataService: DataService,
    private http: HttpClient // Thêm HttpClient vào constructor
  ) {
    this.refreshSubscription = this.dataService.refreshTab1$.subscribe(() => {
      this.getDistributors();
    });
  }

  ngOnInit(): void {
    this.getDistributors();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public getDistributors() {
    this.repoService.getData('api/distributors')
      .subscribe(
        (res) => {
          this.dataSource.data = res as DistributorDto[];
        },
        (err) => {
          console.log(err);
        }
      );
  }

  addDistributor() {
    this.dialog.open(AddDistributorComponent, {
      width: '500px',
      height: '650px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
    });
  }

  updateDistributor(id: number) {
    this.dialog.open(UpdateDistributorComponent, {
      width: '500px',
      height: '650px',
      enterAnimationDuration: '100ms',
      exitAnimationDuration: '100ms',
      data: { id }
    });
  }

  deleteDistributor(id: number) {
    this.dialogService.openConfirmDialog('Are you sure you want to delete this distributor?')
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const deleteUri: string = `api/distributors/${id}`;
          this.repoService.delete(deleteUri).subscribe(
            () => {
              this.dialogService.openSuccessDialog("The distributor has been deleted successfully.")
                .afterClosed()
                .subscribe(() => {
                  this.getDistributors();
                });
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
  }

  // Kích hoạt input file khi người dùng nhấp vào nút Import
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Xử lý khi người dùng chọn file Excel và gửi file lên API
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra loại file
  const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!validTypes.includes(file.type)) {
    this.dialogService.openErrorDialog('Please select a valid Excel file (.xlsx or .xls).');
    return;
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  this.repoService.upload('api/distributors/import', formData).subscribe(
    (res) => {
      this.dialogService.openSuccessDialog('Distributors imported successfully.')
        .afterClosed()
        .subscribe(() => {
          this.getDistributors();
        });
    },
    (error) => {
      this.dialogService.openErrorDialog(`Error importing distributors: ${error.message}`);
    }
  );

  event.target.value = '';
  }

  downloadTemplate() {
    this.repoService.download('api/distributors/template').subscribe(
      (response: Blob) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DistributorTemplate.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        this.dialogService.openErrorDialog('Error downloading template: ' + error.message);
      }
    );
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }
}
