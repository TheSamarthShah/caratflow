export type UploadFile = {
  id: number; // unique timestamp-based ID
  name: string;
  size?: number;
  file?: File; // actual File object for new files
  isDBSaved: boolean; // true = DB file, false = new
  deleted?: boolean; // mark as deleted
}