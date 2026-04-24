import { Injectable } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ScreenTranslationService } from './screen-translation-service';
import { ConfigDataService } from './config-data.service';

@Injectable({ providedIn: 'root' })
export class ScreenResourceService {
  
  private subscriptions = new Map<string, Subscription>();

  constructor(
    private translate: TranslateService,
    private screenTranslationService: ScreenTranslationService,
    private configDataService: ConfigDataService
  ) {}

  async getScreenConfigWithResources(screenName: string, useCache = true, extra = '', onLangChanged?: () => void): Promise<any> {
    const config = await this.configDataService.getScreenConfig(
      screenName,
      !useCache,
      extra,
    );

    if (config) {
      const referenceScreenIds: string[] = config.referenceScreenList ?? [];
      const enumScreenIds: string[] = config.enumScreenList ?? [];
      await this.loadResources(screenName, referenceScreenIds, enumScreenIds, onLangChanged);
    }

    return config;
  }

  async loadResources(screenName: string, referenceScreenIds: string[], enumScreenIds: string[], onLangChanged?: () => void ): Promise<void> {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    await this.reload(screenName, referenceScreenIds, enumScreenIds, lang);
    this.subscribe(screenName, referenceScreenIds, enumScreenIds, onLangChanged);
  }

  destroy(screenName: string) {
    this.subscriptions.get(screenName)?.unsubscribe();
    this.subscriptions.delete(screenName);
  }

  private subscribe(screenName: string, refIds: string[], enumIds: string[], onLangChanged?: () => void) {
    this.subscriptions.get(screenName)?.unsubscribe();

    const sub = this.translate.onLangChange.subscribe(event => {
      this.reload(screenName, refIds, enumIds, event.lang);
      onLangChanged?.();
    });

    this.subscriptions.set(screenName, sub);
  }

  private async reload(screenName: string, refIds: string[], enumIds: string[], lang: string) {
    if(!screenName)
      return;
    const stored = this.translate.store.translations[lang] ?? {};
    const formCached = !!stored['FORM']?.[screenName];
    const uncachedRefIds = refIds.filter(id => !stored['REFERENCESCREEN']?.[id]);
    const uncachedEnumIds = enumIds.filter(id => !stored['ENUMSCREEN']?.[id]);

    if (formCached && uncachedRefIds.length === 0 && uncachedEnumIds.length === 0) {
      return;
    }

    const data: any = await firstValueFrom(
      this.screenTranslationService.getScreenTranslation(
        screenName,
        uncachedRefIds,
        uncachedEnumIds,
        lang
      )
    );

    this.translate.setTranslation(lang, {
      FORM: { [screenName]: data.FORM[screenName] }
    }, true);

    this.translate.setTranslation(lang, {
      REFERENCESCREEN: data.REFERENCESCREEN
    }, true);

    this.translate.setTranslation(lang, {
      ENUMSCREEN: data.ENUMSCREEN
    }, true);
  }
}
