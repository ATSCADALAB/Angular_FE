import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { WcfDataDto } from 'src/app/_interface/wcf-data-dto';
import { SignalRService } from 'src/app/shared/services/signalr.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
})
export class AboutComponent implements OnInit, OnDestroy {
  dataList: WcfDataDto[] = [];
  displayedColumns: string[] = ['name', 'value', 'status', 'timeStamp'];
  private dataSubscription: Subscription;

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.dataSubscription = this.signalRService.dataReceived$.subscribe(data => {
      this.dataList = data;
      console.log('New data received in AboutComponent:', data);
    });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
}