import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, delay, finalize } from "rxjs";
import { LoadingService } from "../shared/services/loading.service";

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    
    constructor(private loadingService: LoadingService) {}
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.includes('api/wcf/write-setting')) {
            return next.handle(req);
          }
        this.loadingService.loading();
        return next.handle(req).pipe(
            delay(1000),
            finalize(() => {
                this.loadingService.idle();
            })
        );
    }

}