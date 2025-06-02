using System;
using System.Collections.Generic;
using System.IO;
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

        public static void Main()
        {
            var logger = new ConsoleLogger();

            try
            {
                string projectDirectory = Path.GetDirectoryName(
                    System.Reflection.Assembly.GetExecutingAssembly().Location
                );

                string dotEnvFilePath = Path.Combine(projectDirectory, ".env");
                var appConfig = new AppConfig(dotEnvFilePath);

                var organisationService = OrganisationServiceFactory.Build(appConfig, logger);

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
