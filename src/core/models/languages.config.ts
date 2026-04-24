export type LanguageConfig  = {
  code: string;
  name: string;
  locale: string;
  dateFormat: { [key in string]: string };
  numberFormat : string;
  timeFormat: string;
}
export const Language_Config  : LanguageConfig[]  = [
  { code: 'en', name: 'English', locale: 'en-US', timeFormat: '12', dateFormat : {YMD : 'MMM-dd-yyyy'}, numberFormat : '###,###'},
  { code: 'jp', name: '日本語', locale: 'ja-JP', timeFormat: '24' , dateFormat : {YMD : 'yyyy/MM/dd'}, numberFormat : '##,###'},
];

export function updateDateFormat(code: string, dateFormat: {[key in string]: string}): void {
  const lang = Language_Config.find(l => l.code === code);
  if (lang) {
    lang.dateFormat = { ...dateFormat };
  }
}

export function updateNumberFormat(code: string, numberFormat: string) : void {
  const lang = Language_Config.find(l => l.code === code);
  if (lang) {
    lang.numberFormat = numberFormat;
  }
}

export type Languages = 'en' | 'jp';