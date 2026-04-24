import { inject, Injectable } from '@angular/core';
import { AppInfoService } from 'src/app/shared/services/app-info.service';

@Injectable({
    providedIn: 'root',
})
export class ConfigDataService {
    appInfoService = inject(AppInfoService);

    private cache: Map<string, any> = new Map(); // Stores cached data per endpoint
    private pending: Map<string, Promise<any>> = new Map(); // Tracks ongoing API calls per endpoint to prevent duplicates

    private async fetchWithCache<T>(cacheKey: string, apiFn: () => Promise<T>, isForceCallAPI = false): Promise<T> {
        // Return cached data if exists
        if (!isForceCallAPI && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) as T;
        }

        // If API call is already in progress for same key, wait for its result
        if (this.pending.has(cacheKey) && !isForceCallAPI) {
            return await (this.pending.get(cacheKey) as Promise<T>);
        }

        // New API call — cache the Promise to prevent duplicate calls
        this.pending.set(cacheKey, apiFn() as Promise<any>);

        try {
            // Wait for the API response
            const data = await (this.pending.get(cacheKey) as Promise<T>);
            if (data != null && data != undefined) {
                this.cache.set(cacheKey, data);
            }
            return data;
        } finally {
            this.pending.delete(cacheKey);
        }
    }

    getMainMenuConfig(isForceCallAPI = false): Promise<any[]> {
        return this.fetchWithCache(
            'main-menu',
            () => this.appInfoService.getMainMenu(),
            isForceCallAPI,
        );
    }

    getScreenConfig(
        screenName: string,
        isForceCallAPI = false,
        historyTableId = '',
    ): Promise<any> {
        return this.fetchWithCache(
            `column-info.${screenName}`,
            () => this.appInfoService.getScreen(screenName, historyTableId),
            isForceCallAPI,
        );
    }

    getReferenceScreenConfig(screenName: string, isForceCallAPI = false): Promise<any> {
        return this.fetchWithCache(
            `reference-screen.${screenName}`,
            () => this.appInfoService.getReferenceScreen(screenName),
            isForceCallAPI,
        );
    }

  // async getMainMenu(endpoint: string, isForceCallAPI: boolean = false,historyTableId : string = ''): Promise<any> {
  //     // Return cached data for specific endpoint if exist
  //     if (!isForceCallAPI && this.cachedMenuData.has(endpoint)) {
  //         return this.cachedMenuData.get(endpoint)!;
  //     }
  //     // If API call is in progress for same endpoint, wait for it's result'
  //     if (this.apiCallPromise.has(endpoint) && !isForceCallAPI) {
  //         return await this.apiCallPromise.get(endpoint)!;
  //     }
  //     // New API call for endpoint, cache the Promise to prevent duplicates
  //     this.apiCallPromise.set(endpoint, this.appInfoService.getConfigData(endpoint,historyTableId));
  //     try {
  //         // Wait for the API response
  //         const data = await this.apiCallPromise.get(endpoint)!;  // Assert non-null since we just set it
  //         if(data != null && data != undefined){
  //             this.cachedMenuData.set(endpoint, data);
  //         }
  //         return data;
  //     } finally {
  //         this.apiCallPromise.delete(endpoint);
  //     }
  // }

  reset(): void {
    this.cache.clear();
    this.pending.clear();
  }
}
