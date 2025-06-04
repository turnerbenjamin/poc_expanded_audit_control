/**
 * Auto-generated TypeScript schema dictionary for Dataverse entities
 * and relationships
 * Generated on: 2025-06-04 08:11:56
 */

export interface _dataverseAttributeMetadata {
	label: string;
	type: string;
}

export interface _dataverseEntityMetadata {
	logicalName: string;
	displayName: string;
	idField: string;
	primaryNameField: string;
	attributes: Record<string, _dataverseAttributeMetadata>;
}

export interface _dataverseRelationshipMetadata {
	id: string;
	schemaName: string;
	relationshipType: string;
	entity1: string;
	entity2: string;
}

export const _entityMetadata: Record<string, _dataverseEntityMetadata> = {
	"ardea_booking": {
		logicalName: "ardea_booking",
		displayName: "Booking",
		idField: "ardea_bookingid",
		primaryNameField: "ardea_name",
		attributes: {
			"ardea_date": {
				label: "Date",
				type: "DateTime"
			},
			"ardea_description": {
				label: "Description",
				type: "String"
			},
			"ardea_invoiceamount": {
				label: "Invoice Amount",
				type: "Money"
			},
			"ardea_invoiceamount_base": {
				label: "Invoice Amount (Base)",
				type: "Money"
			},
			"ardea_name": {
				label: "Name",
				type: "String"
			},
			"exchangerate": {
				label: "Exchange Rate",
				type: "Decimal"
			},
			"importsequencenumber": {
				label: "Import Sequence Number",
				type: "Integer"
			},
			"overriddencreatedon": {
				label: "Record Created On",
				type: "DateTime"
			},
			"ownerid": {
				label: "Owner",
				type: "Owner"
			},
			"owningbusinessunit": {
				label: "Owning Business Unit",
				type: "Lookup"
			},
			"statecode": {
				label: "Status",
				type: "State"
			},
			"statuscode": {
				label: "Status Reason",
				type: "Status"
			},
			"transactioncurrencyid": {
				label: "Currency",
				type: "Lookup"
			}
		}
	},
	"ardea_party": {
		logicalName: "ardea_party",
		displayName: "Party",
		idField: "ardea_partyid",
		primaryNameField: "ardea_name",
		attributes: {
			"ardea_name": {
				label: "Name",
				type: "String"
			},
			"importsequencenumber": {
				label: "Import Sequence Number",
				type: "Integer"
			},
			"overriddencreatedon": {
				label: "Record Created On",
				type: "DateTime"
			},
			"ownerid": {
				label: "Owner",
				type: "Owner"
			},
			"owningbusinessunit": {
				label: "Owning Business Unit",
				type: "Lookup"
			},
			"statecode": {
				label: "Status",
				type: "State"
			},
			"statuscode": {
				label: "Status Reason",
				type: "Status"
			}
		}
	},
	"ardea_seatingplans": {
		logicalName: "ardea_seatingplans",
		displayName: "Seating Plans",
		idField: "ardea_seatingplansid",
		primaryNameField: "ardea_name",
		attributes: {
			"ardea_name": {
				label: "Name",
				type: "String"
			},
			"importsequencenumber": {
				label: "Import Sequence Number",
				type: "Integer"
			},
			"overriddencreatedon": {
				label: "Record Created On",
				type: "DateTime"
			},
			"ownerid": {
				label: "Owner",
				type: "Owner"
			},
			"owningbusinessunit": {
				label: "Owning Business Unit",
				type: "Lookup"
			},
			"statecode": {
				label: "Status",
				type: "State"
			},
			"statuscode": {
				label: "Status Reason",
				type: "Status"
			}
		}
	},
	"ardea_entertainer": {
		logicalName: "ardea_entertainer",
		displayName: "Entertainer",
		idField: "ardea_entertainerid",
		primaryNameField: "ardea_name",
		attributes: {
			"ardea_name": {
				label: "Name",
				type: "String"
			},
			"importsequencenumber": {
				label: "Import Sequence Number",
				type: "Integer"
			},
			"overriddencreatedon": {
				label: "Record Created On",
				type: "DateTime"
			},
			"ownerid": {
				label: "Owner",
				type: "Owner"
			},
			"owningbusinessunit": {
				label: "Owning Business Unit",
				type: "Lookup"
			},
			"statecode": {
				label: "Status",
				type: "State"
			},
			"statuscode": {
				label: "Status Reason",
				type: "Status"
			}
		}
	},
	"ardea_venue": {
		logicalName: "ardea_venue",
		displayName: "Venue",
		idField: "ardea_venueid",
		primaryNameField: "ardea_name",
		attributes: {
			"ardea_name": {
				label: "Name",
				type: "String"
			},
			"importsequencenumber": {
				label: "Import Sequence Number",
				type: "Integer"
			},
			"overriddencreatedon": {
				label: "Record Created On",
				type: "DateTime"
			},
			"ownerid": {
				label: "Owner",
				type: "Owner"
			},
			"owningbusinessunit": {
				label: "Owning Business Unit",
				type: "Lookup"
			},
			"statecode": {
				label: "Status",
				type: "State"
			},
			"statuscode": {
				label: "Status Reason",
				type: "Status"
			}
		}
	}};

export const _relationshipMetadata: _dataverseRelationshipMetadata[] = [
	{
		id: "a9d556e7-db3e-f011-877a-7c1e5202cd37",
		schemaName: "ardea_party_Booking_ardea_booking",
		relationshipType: "1:N",
		entity1: "ardea_booking",
		entity2: "ardea_party"
	},
	{
		id: "e0343ef0-393d-f011-877b-7c1e5202cd37",
		schemaName: "ardea_seatingplans_Booking_ardea_booking",
		relationshipType: "1:N",
		entity1: "ardea_booking",
		entity2: "ardea_seatingplans"
	},
	{
		id: "1f3a01db-ea39-f011-8c4e-7c1e5202cd37",
		schemaName: "ardea_Booking_Contact_Attendees",
		relationshipType: "N:N",
		entity1: "contact",
		entity2: "ardea_booking"
	},
	{
		id: "99b3767f-c33a-f011-8c4e-7c1e5202cd37",
		schemaName: "ardea_Booking_ardea_Entertainer_Entertainment",
		relationshipType: "N:N",
		entity1: "ardea_entertainer",
		entity2: "ardea_booking"
	},
	{
		id: "a2205ecd-ea39-f011-8c4e-7c1e5202cd37",
		schemaName: "ardea_booking_Venue_ardea_venue",
		relationshipType: "1:N",
		entity1: "ardea_venue",
		entity2: "ardea_booking"
	}];
