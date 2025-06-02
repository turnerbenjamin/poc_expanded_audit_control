using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using SchemaBuilder.Model;

namespace SchemaBuilder.Service
{
    class MetadataService
    {
        private readonly IOrganizationService _organisationService;

        public MetadataService(IOrganizationService organizationService)
        {
            _organisationService = organizationService;
        }

        public List<DataverseSchema> GetSchemaData(IEnumerable<string> entities)
        {
            var dataverseSchemas = new List<DataverseSchema>();
            foreach (var entityName in entities)
            {
                EntityMetadata entityMetadata = GetEntitySchemaData(entityName);

                if (!entityMetadata.IsAuditEnabled.Value)
                {
                    continue;
                }

                var attributes = new List<DataverseAttribute>();
                foreach (var attribute in entityMetadata.Attributes)
                {
                    if (!attribute.IsAuditEnabled.Value)
                    {
                        continue;
                    }

                    string displayName = attribute.DisplayName?.UserLocalizedLabel?.Label;
                    if (displayName != null)
                    {
                        string logicalName = attribute.LogicalName;
                        var type = attribute.AttributeType.ToString();
                        attributes.Add(new DataverseAttribute(logicalName, displayName, type));
                    }
                }

                dataverseSchemas.Add(
                    new DataverseSchema(
                        entityMetadata.LogicalName,
                        entityMetadata.DisplayName.UserLocalizedLabel.Label,
                        entityMetadata.PrimaryNameAttribute,
                        entityMetadata.PrimaryIdAttribute,
                        attributes
                    )
                );
            }

            return dataverseSchemas;
        }

        private EntityMetadata GetEntitySchemaData(string entityName)
        {
            var metadataRequest = new RetrieveEntityRequest
            {
                EntityFilters = EntityFilters.Attributes,
                LogicalName = entityName,
            };

            var metadataResponse =
                _organisationService.Execute(metadataRequest) as RetrieveEntityResponse;

            return metadataResponse.EntityMetadata;
        }

        public IEnumerable<DataverseRelationship> GetCustomRelationshipData(
            IEnumerable<string> entities
        )
        {
            var relationships = new List<DataverseRelationship>();

            foreach (string entity in entities)
            {
                List<DataverseRelationship> entityRelationships = GetEntityRelationshipData(entity);
                relationships.AddRange(entityRelationships);
            }
            return relationships.Distinct().Where(r => r.IsCustomRelationship);
        }

        private List<DataverseRelationship> GetEntityRelationshipData(string entityName)
        {
            var metadataRequest = new RetrieveEntityRequest
            {
                EntityFilters = EntityFilters.Relationships,
                LogicalName = entityName,
            };

            var metadataResponse =
                _organisationService.Execute(metadataRequest) as RetrieveEntityResponse;

            return ParseEntityRelationshipData(metadataResponse.EntityMetadata);
        }

        private List<DataverseRelationship> ParseEntityRelationshipData(
            EntityMetadata entityMetadata
        )
        {
            var relationships = new List<DataverseRelationship>();

            if (entityMetadata.OneToManyRelationships != null)
            {
                foreach (var relationship in entityMetadata.OneToManyRelationships)
                {
                    relationships.Add(ParseOneToManyRelationships(relationship));
                }
            }

            if (entityMetadata.ManyToManyRelationships != null)
            {
                foreach (var relationship in entityMetadata.ManyToManyRelationships)
                {
                    relationships.Add(ParseManyToManyRelationships(relationship));
                }
            }
            return relationships;
        }

        private DataverseRelationship ParseOneToManyRelationships(
            OneToManyRelationshipMetadata relationship
        )
        {
            var relationshipType = "1:N";
            var entity1 = relationship.ReferencedEntity;
            var entityN = relationship.ReferencingEntity;

            return new DataverseRelationship(
                relationship.MetadataId,
                relationship.SchemaName,
                relationshipType,
                entity1,
                entityN,
                relationship.IsCustomRelationship.Value
            );
        }

        private DataverseRelationship ParseManyToManyRelationships(
            ManyToManyRelationshipMetadata relationship
        )
        {
            var relationshipType = "N:N";
            var entityN1 = relationship.Entity1LogicalName;
            var entityN2 = relationship.Entity2LogicalName;

            return new DataverseRelationship(
                relationship.MetadataId,
                relationship.SchemaName,
                relationshipType,
                entityN1,
                entityN2,
                relationship.IsCustomRelationship.Value
            );
        }
    }
}
