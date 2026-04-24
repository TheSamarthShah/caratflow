export type confirmChangesGuardComponent = {
  confirmChanges: () => Promise<changesReturn>;
};

export type changesReturn = {
  proceed: boolean;
  hasChanges: boolean;
};
