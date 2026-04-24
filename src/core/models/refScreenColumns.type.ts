export type refScreenColumns = {
  name: string;
  displayName: string;
  dataType: string; //1: string, 2: number, 3: date, 4: kbn
  visible: boolean;
  width: string;
  searchVisible: boolean;
  memberList?: Array<{
    code: string;
    name: string;
  }>;
  mainScreenColumn?: string;
  defaultValueColumn?: string;
  orderBySeq?: number;
};
