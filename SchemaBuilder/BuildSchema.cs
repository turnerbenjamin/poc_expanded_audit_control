using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SchemaBuilder.Config;
using SchemaBuilder.Logger;
using SchemaBuilder.Model;
using SchemaBuilder.OrganisationService;
using SchemaBuilder.Service;
using SchemaBuilder.Utilities;

namespace SchemaBuilder
{
    public class DataverseLinqApp
    {
        private static readonly List<string> _entities = new List<string>()
        {
            "ardea_booking",
            "ardea_venue",
        };

        public static async Task Main(string[] args)
        {
            var logger = new ConsoleLogger();

            try
            {
                if (args == null || args.Length != 1)
                {
                    throw new ArgumentNullException(
                        nameof(args),
                        "Pass instance url as the first argument, e.g. npm "
                            + "run schemaBuilder https://{ORG}.crm11.dynamics.com/"
                    );
                }

                var instanceUri = args[0];
                var organisationService = await OrganisationServiceFactory.BuildWithInteractiveAuth(
                    instanceUri,
                    logger
                );

                var metadataService = new MetadataService(organisationService);

                var relationshipData = metadataService.GetCustomRelationshipData(_entities);
                var entitiesInRelationships = GetEntitiesInRelationships(relationshipData);

                List<DataverseSchema> schemaData = metadataService.GetSchemaData(
                    entitiesInRelationships
                );

                string ts = TypeScriptWriter.SchemaToTypescript(schemaData, relationshipData);
                string outputPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "./ExpandedAuditingControl/model/cached_dataverse_metadata.ts"
                );
                File.WriteAllText(outputPath, ts.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
        }

        private static IEnumerable<string> GetEntitiesInRelationships(
            IEnumerable<DataverseRelationship> relationships
        )
        {
            var entitiesInRelationships = new HashSet<string>();

            foreach (DataverseRelationship relationship in relationships)
            {
                entitiesInRelationships.Add(relationship.Entity1);
                entitiesInRelationships.Add(relationship.Entity2);
            }
            return entitiesInRelationships;
        }
    }
}
