import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, ProcessedOrder } from './app.models';
import {
  catchError,
  defer,
  finalize, map,
  Observable,
  of,
  ReplaySubject,
  takeUntil,
  throwError
} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);
  public orders: Observable<ProcessedOrder[]> = of([]);
  public hasError: boolean = false;
  public loaded: boolean = false;
  public date: Date = new Date(Date.now());
  public readonly displayedColumns: string[] = ['name', 'netAmount'];
  private readonly url = 'https://script.google.com/macros/s/AKfycbxhNj8_XHy53fPhS_HBYEcTIZvYfc22ZOrMHHQgT071iL35Z6n7lEIPmi1ANv6dJ4gcEw/exec';

  constructor(
    private httpClient: HttpClient
  ) {
  }

  ngOnInit() {
    this.orders = this.fetchOrders();
  }

  private fetchOrders(): Observable<ProcessedOrder[]> {
    return defer<Observable<ProcessedOrder[]>>(() => {
      this.loaded = false;
      return this.httpClient.get<Order[]>(this.url)
        .pipe(
          finalize(() => {
            this.loaded = true;
          }),
          map<Order[], ProcessedOrder[]>((orders: Order[]) => {
            return orders.map<ProcessedOrder>((order: Order) => ({
              name: order.name,
              netAmount: `${order.quantity} ${order.unit}`
            }))
          })
        )
    })
      .pipe(
        takeUntil(this.destroyed$),
        catchError((err, caught) => {
          this.hasError = true
          console.log(err);
          return throwError(err);
        })
      )
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
