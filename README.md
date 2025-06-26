# Expanded Audit Control

## Adding to a Form

The control accepts three parameters:

- Primary Entity Primary Key
- Primary Entity ID
- Control Config

### Primary Entity Primary Key

To be added to a model-driven app, a PCF requires a bound field. This is used
to satisfy this requirement only. Select any field.

### Primary Entity ID

This cannot be added as a bound field, probably because it is readonly. When
adding an input you can select to bind to a field, select the relevant field
containing the primary record's ID

### Control Config

This is used to define the related entities to include in the control. The
config should be a JSON object implementing the ServiceEntityQuery interface:

```ts
export interface ServiceExpandedItem {
    propertyName: string;
    relatedEntityLogicalName: EntityLogicalName;
    oneOrMany: ServiceOneOrMany;
    isManyToMany: boolean;
    doInclude: boolean | undefined;
    expand: ServiceExpandedItem[] | undefined;
}

export interface ServiceEntityQuery {
    primaryEntityLogicalName: EntityLogicalName;
    expand: ServiceExpandedItem[];
}
```

You can include all relationship types in the top level expand, including N:N
relationships. You can also include nested expands up to a depth of 4 for more
complex relationships. However, a query will fail if it includes both N:N
relationships and nested expands.

It is easiest to use an IDE to construct the JSON and paste it in. Structural
errors are thrown early so should be shown when adding the control to the form.

```json
{
    "primaryEntityLogicalName": "ardea_booking",
    "expand": [
        {
            "propertyName": "ardea_seatingplans_Booking_ardea_booking",
            "relatedEntityLogicalName": "ardea_seatingplans",
            "oneOrMany": "many",
            "isManyToMany": false
        },
        {
            "propertyName": "ardea_Venue",
            "relatedEntityLogicalName": "ardea_venue",
            "oneOrMany": "one",
            "isManyToMany": false,
            "doInclude": true
        },
        {
            "propertyName": "ardea_invoice_BookingId_ardea_booking",
            "relatedEntityLogicalName": "ardea_invoice",
            "oneOrMany": "many",
            "isManyToMany": false,
            "doInclude": false,
            "expand": [
                {
                    "propertyName": "ardea_invoicelineitem_Invoice_ardea_invoice",
                    "relatedEntityLogicalName": "ardea_invoicelineitem",
                    "oneOrMany": "many",
                    "isManyToMany": false,
                    "doInclude": true,
                    "expand": [
                        {
                            "propertyName": "ardea_VATRate",
                            "relatedEntityLogicalName": "ardea_vatrate",
                            "oneOrMany": "one",
                            "isManyToMany": false,
                            "doInclude": true
                        }
                    ]
                }
            ]
        }
    ]
}
```
