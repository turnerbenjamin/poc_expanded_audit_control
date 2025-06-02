using System.Collections.Generic;

namespace SchemaBuilder.Model
{
    public class DataverseSchema
    {
        public string LogicalName { get; }
        public string DisplayName { get; }
        public string PrimaryNameField { get; }
        public string IdField { get; }
        public IEnumerable<DataverseAttribute> Attributes { get; }

        public DataverseSchema(
            string logicalName,
            string displayName,
            string primaryAttributeName,
            string idField,
            IEnumerable<DataverseAttribute> attributes
        )
        {
            LogicalName = logicalName;
            DisplayName = displayName;
            PrimaryNameField = primaryAttributeName;
            IdField = idField;
            Attributes = attributes;
        }
    }
}
