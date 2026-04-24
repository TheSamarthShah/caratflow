import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { API_ENDPOINTS } from "src/app/shared/api-endpoints";

@Injectable({
  providedIn: 'root',
})

export class MenuFavoriteService {
  BASE_URL = API_ENDPOINTS.BASE + '/config';

   favoriteUpdated$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  addFavorite(path: string, data: any): Observable<string> {    
    return this.http.post(`${this.BASE_URL}/${path}`, { path, data }, { responseType: 'text' });
  }

  deleteFavorite(path: string, data: any): Observable<string> {
    return this.http.post(`${this.BASE_URL}/Delete/${path}`, { path, data }, { responseType: 'text' });
  }

   notifyChange() {
    this.favoriteUpdated$.next(); 
  }
}

