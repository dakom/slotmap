export enum ErrorKind {
  NO_KEY = "No such key",
  MISMATCHED_INDEX_VALUES= "values and type_indices must match",
  NOT_ENOUGH_VALUES= "not enough values",
  INVALID_TYPE_INDEX = "No type at that index",
  EXHAUSTED_KEY_REMOVAL = "Ran out of room for key removal"
}