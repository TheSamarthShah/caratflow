export type SaveData = {
    AddList: Array<any>;
    UpdateList: Array<any>;
    DeleteList: Array<any>;
};

export type ParentChildSaveData = {
  validStatus: boolean;
  // All dynamic keys go inside this 'data' object
  data: Record<string, SaveData>;
};