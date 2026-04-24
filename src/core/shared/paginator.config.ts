import { MatPaginatorIntl } from '@angular/material/paginator';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class CustomPaginator extends MatPaginatorIntl {
  private langChangeSub!: Subscription;

  constructor(private translate: TranslateService) {
    super();
    this.getTranslations();

    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.getTranslations();
      this.changes.next(); 
    });
  }
  override itemsPerPageLabel = '';//'表示件数:';
  override nextPageLabel = ''; //'次のページ';
  override previousPageLabel = ''; //'前のページ';
  override firstPageLabel = ''; //'最初のページ';
  override lastPageLabel = ''; //'最後のページ';

   private getTranslations() {
    //this.itemsPerPageLabel = this.translate.instant('PAGINATOR.ITEMS_PER_PAGE');
    this.nextPageLabel = this.translate.instant('PAGINATOR.NEXT_PAGE');
    this.previousPageLabel = this.translate.instant('PAGINATOR.PREVIOUS_PAGE');
    this.firstPageLabel = this.translate.instant('PAGINATOR.FIRST_PAGE');
    this.lastPageLabel = this.translate.instant('PAGINATOR.LAST_PAGE');
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      //return `0 件中 0 件を表示`;
       return this.translate.instant('PAGINATOR.RANGE_EMPTY');
    }
    
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    const totalPages = Math.ceil(length / pageSize);
    
    // Current page is page + 1 because page index starts at 0
    //return `${startIndex + 1}–${endIndex} 件 / 総計 ${length} 件 (${page + 1} / ${totalPages})`;

     return this.translate.instant('PAGINATOR.RANGE_LABEL', {
      start: startIndex + 1,
      end: endIndex,
      length: length,
      page: page + 1,
      totalPages: totalPages,
    });
  };

  ngOnDestroy() {
    this.langChangeSub?.unsubscribe();
  }
}