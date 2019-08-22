export {create_slotmap} from "./core/slotmap";
export * from "./core/errors";
export {
    Key, 
    KeyList, 
    KeyId, 
    KeyVersion,

    extract_key_id,
    extract_key_version,

    N_ID_BITS,
    N_VERSION_BITS,
    MAX_ID,
    ID_MASK,
    MAX_VERSION,
    VERSION_MASK,
} from "./core/key";