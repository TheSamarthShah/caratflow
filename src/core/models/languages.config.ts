export type DateFormatKey = 'YMDHms' | 'MDHms' | 'Hms' | 'Hm' | 'ms' | 'YM' | 'YMD' | 'MD' | 'YMDHm';

export type LanguageConfig = {
  code: string;
  name: string;
  locale: string;
  dateFormat: Record<DateFormatKey, { displayDate: string; inputDate: string; displayTime: string; inputTime: string }>;
  numberFormat: string;
  timeFormat: string;
};

export const Language_Config: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    locale: 'en-US',
    timeFormat: '12',
    numberFormat: '###,###',
    dateFormat: {
      'YMDHms': { displayDate: 'MMM-dd-yyyy', inputDate: 'MM/dd/yyyy', displayTime: 'hh:mm:ss a', inputTime: 'hh:mm:ss a' },
      'MDHms':  { displayDate: 'MMM-dd',      inputDate: 'MM/dd',      displayTime: 'hh:mm:ss a', inputTime: 'hh:mm:ss a' },
      'Hms':    { displayDate: '',            inputDate: '',           displayTime: 'hh:mm:ss a', inputTime: 'hh:mm:ss a' },
      'Hm':     { displayDate: '',            inputDate: '',           displayTime: 'hh:mm a',    inputTime: 'hh:mm a' },
      'ms':     { displayDate: '',            inputDate: '',           displayTime: 'mm:ss',      inputTime: 'mm:ss' },
      'YM':     { displayDate: 'yyyy-MMM',    inputDate: 'MM/yyyy',    displayTime: '',           inputTime: '' },
      'YMD':    { displayDate: 'MMM-dd-yyyy', inputDate: 'MM/dd/yyyy', displayTime: '',           inputTime: '' },
      'MD':     { displayDate: 'MMM-dd',      inputDate: 'MM/dd',      displayTime: '',           inputTime: '' },
      'YMDHm':  { displayDate: 'MMM-dd-yyyy', inputDate: 'MM/dd/yyyy', displayTime: 'hh:mm a',    inputTime: 'hh:mm a' }
    }
  },
  {
    code: 'jp',
    name: '日本語',
    locale: 'ja-JP',
    timeFormat: '24',
    numberFormat: '##,###',
    dateFormat: {
      'YMDHms': { displayDate: 'yyyy/MM/dd', inputDate: 'yyyy/MM/dd', displayTime: 'HH:mm:ss', inputTime: 'HH:mm:ss' },
      'MDHms':  { displayDate: 'MM/dd',      inputDate: 'MM/dd',      displayTime: 'HH:mm:ss', inputTime: 'HH:mm:ss' },
      'Hms':    { displayDate: '',           inputDate: '',           displayTime: 'HH:mm:ss', inputTime: 'HH:mm:ss' },
      'Hm':     { displayDate: '',           inputDate: '',           displayTime: 'HH:mm',    inputTime: 'HH:mm' },
      'ms':     { displayDate: '',           inputDate: '',           displayTime: 'mm:ss',    inputTime: 'mm:ss' },
      'YM':     { displayDate: 'yyyy/MM',    inputDate: 'yyyy/MM',    displayTime: '',         inputTime: '' },
      'YMD':    { displayDate: 'yyyy/MM/dd', inputDate: 'yyyy/MM/dd', displayTime: '',         inputTime: '' },
      'MD':     { displayDate: 'MM/dd',      inputDate: 'MM/dd',      displayTime: '',         inputTime: '' },
      'YMDHm':  { displayDate: 'yyyy/MM/dd', inputDate: 'yyyy/MM/dd', displayTime: 'HH:mm',    inputTime: 'HH:mm' }
    }
  }
];

export function updateDateFormat(code: string, dateFormat: { [key: string]: string }): void {
  console.warn('updateDateFormat is deprecated. Date formats are now strictly hardcoded in Language_Config.');
}

export function updateNumberFormat(code: string, numberFormat: string): void {
  const lang = Language_Config.find(l => l.code === code);
  if (lang) {
    lang.numberFormat = numberFormat;
  }
}

export type Languages = 'en' | 'jp';