using System;
using System.Collections.Generic;
using System.Text;
using SchemaBuilder.Model;

namespace SchemaBuilder.Utilities
{
    public static class TypeScriptWriter
    {
        public static string SchemaToTypescript(
            IEnumerable<DataverseSchema> schemaData,
            IEnumerable<DataverseRelationship> relationships
        )
        {
            var sb = new StringBuilder();
            AddHeaderText(sb);
            DeclareTypes(sb);

            sb.AppendLine(
                "export const _entityMetadata: Record<string, _dataverseEntityMetadata> = {"
            );
            AppendSchemaData(sb, schemaData);
            sb.AppendLine("};");
            sb.AppendLine();

            sb.AppendLine(
                "export const _relationshipMetadata: _dataverseRelationshipMetadata[] = ["
            );
            AppendRelationshipData(sb, relationships);
            sb.AppendLine("];");

            return sb.ToString();
        }

        private static void AddHeaderText(StringBuilder sb)
        {
            sb.AppendLine("/**");
            sb.AppendLine(" * Auto-generated TypeScript schema dictionary for Dataverse entities");
            sb.AppendLine(" * and relationships");
            sb.AppendLine(" * Generated on: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            sb.AppendLine(" */");
            sb.AppendLine();
        }

        private static void DeclareTypes(StringBuilder sb)
        {
            sb.AppendLine("export interface _dataverseAttributeMetadata {");
            sb.AppendLine("\tlabel: string;");
            sb.AppendLine("\ttype: string;");
            sb.AppendLine("}");
            sb.AppendLine();

            sb.AppendLine("export interface _dataverseEntityMetadata {");
            sb.AppendLine("\tlogicalName: string;");
            sb.AppendLine("\tdisplayName: string;");
            sb.AppendLine("\tidField: string;");
            sb.AppendLine("\tprimaryNameField: string;");
            sb.AppendLine("\tattributes: Record<string, _dataverseAttributeMetadata>;");
            sb.AppendLine("}");
            sb.AppendLine();

            sb.AppendLine("export interface _dataverseRelationshipMetadata {");
            sb.AppendLine("\tid: string;");
            sb.AppendLine("\tschemaName: string;");
            sb.AppendLine("\trelationshipType: string;");
            sb.AppendLine("\tentity1: string;");
            sb.AppendLine("\tentity2: string;");
            sb.AppendLine("}");
            sb.AppendLine();
        }

        private static void AppendSchemaData(
            StringBuilder sb,
            IEnumerable<DataverseSchema> schemaData
        )
        {
            bool isFirstEntity = true;
            foreach (DataverseSchema schema in schemaData)
            {
                if (!isFirstEntity)
                {
                    sb.Append(",\n");
                }
                else
                {
                    isFirstEntity = false;
                }

                sb.AppendLine($"\t\"{schema.LogicalName}\": {{");
                sb.AppendLine($"\t\tlogicalName: \"{schema.LogicalName}\",");
                sb.AppendLine($"\t\tdisplayName: \"{schema.DisplayName}\",");
                sb.AppendLine($"\t\tidField: \"{schema.IdField}\",");
                sb.AppendLine($"\t\tprimaryNameField: \"{schema.PrimaryNameField}\",");
                sb.AppendLine($"\t\tattributes: {{");
                AppendAttributeData(sb, schema.Attributes);
                sb.AppendLine($"\n\t\t}}");
                sb.Append("\t}");
            }
        }

        private static void AppendAttributeData(
            StringBuilder sb,
            IEnumerable<DataverseAttribute> attributeData
        )
        {
            bool isFirstAttribute = true;
            foreach (DataverseAttribute attribute in attributeData)
            {
                if (!isFirstAttribute)
                {
                    sb.Append(",\n");
                }
                else
                {
                    isFirstAttribute = false;
                }

                sb.AppendLine($"\t\t\t\"{attribute.LogicalName}\": {{");
                sb.AppendLine($"\t\t\t\tlabel: \"{attribute.Label}\",");
                sb.AppendLine($"\t\t\t\ttype: \"{attribute.Type}\"");
                sb.Append($"\t\t\t}}");
            }
        }

        private static void AppendRelationshipData(
            StringBuilder sb,
            IEnumerable<DataverseRelationship> relationships
        )
        {
            bool isFirstRelationship = true;
            foreach (DataverseRelationship relationship in relationships)
            {
                if (!isFirstRelationship)
                {
                    sb.Append(",\n");
                }
                else
                {
                    isFirstRelationship = false;
                }

                sb.AppendLine($"\t{{");
                sb.AppendLine($"\t\tid: \"{relationship.Id}\",");
                sb.AppendLine($"\t\tschemaName: \"{relationship.SchemaName}\",");
                sb.AppendLine($"\t\trelationshipType: \"{relationship.RelationshipType}\",");
                sb.AppendLine($"\t\tentity1: \"{relationship.Entity1}\",");
                sb.AppendLine($"\t\tentity2: \"{relationship.Entity2}\"");
                sb.Append($"\t}}");
            }
        }
    }
}
