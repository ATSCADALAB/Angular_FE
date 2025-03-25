import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimezonePipe } from './pipes/timezone.pipe';

@NgModule({
  declarations: [
    TimezonePipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TimezonePipe
  ]
})
export class SharedModule { } 