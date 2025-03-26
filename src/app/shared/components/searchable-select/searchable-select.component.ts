import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss']
})
export class SearchableSelectComponent<T> implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() items: T[] = [];
  @Input() displayField: keyof T;
  @Input() valueField: keyof T;
  @Input() initialValue: number | null = null;

  // Định kiểu rõ ràng cho Output
  @Output() valueChange = new EventEmitter<number | null>();

  filteredItems: T[] = [];
  searchQuery: string = '';
  selectedValue: number | null = null;

  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.selectedValue = this.initialValue;
    this.filteredItems = [...this.items];
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.filterItems());
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  filterItems(): void {
    if (!this.searchQuery) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item =>
        String(item[this.displayField]).toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  onValueChange(value: number | null): void {
    this.selectedValue = value;
    this.valueChange.emit(value);
  }

  allowSpaceInput(event: KeyboardEvent): void {
    if (event.key === ' ' || event.code === 'Space') {
      event.stopPropagation();
    }
  }

  onSelectOpened(opened: boolean): void {
    if (opened) {
      setTimeout(() => {
        const input = document.querySelector(`.search-input input[placeholder="Search ${this.label.toLowerCase()}..."]`) as HTMLInputElement;
        input?.focus();
      });
    }
  }
}