import { DataverseEntityMetadata } from "./dataverseMetadataTypes";

export interface DataverseEntity {
    id: string;
    primaryNameFieldValue: string;
    metadata: DataverseEntityMetadata;
}
