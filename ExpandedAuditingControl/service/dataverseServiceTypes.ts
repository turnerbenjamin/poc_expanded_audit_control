export interface EntityQuery {
    logicalName: string;
    id: string;
    select: string[];
}

export interface RelationshipQuery {
    relationshipName: string;
    select: string[];
}

export interface GetRecordAndRelatedRecordsQuery {
    primaryEntity: EntityQuery;
    relationships: RelationshipQuery[];
}
