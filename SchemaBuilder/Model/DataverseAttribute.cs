namespace SchemaBuilder.Model
{
    public class DataverseAttribute
    {
        public string LogicalName { get; }
        public string Label { get; }
        public string Type { get; }

        public DataverseAttribute(string logicalName, string label, string type)
        {
            LogicalName = logicalName;
            Label = label;
            Type = type;
        }
    }
}
