using System;

public class DataverseRelationship : IEquatable<DataverseRelationship>
{
    public Guid Id { get; }
    public string SchemaName { get; }
    public string RelationshipType { get; }
    public string Entity1 { get; }
    public string Entity2 { get; }
    public bool IsCustomRelationship { get; }

    public DataverseRelationship(
        Guid? id,
        string schemaName,
        string relationshipType,
        string entity1,
        string entity2,
        bool isCustomRelationship
    )
    {
        if (Id == null)
        {
            throw new Exception($"Dataverse relationship id is null ({schemaName})");
        }
        Id = (Guid)id;
        SchemaName = schemaName;
        RelationshipType = relationshipType;
        Entity1 = entity1;
        Entity2 = entity2;
        IsCustomRelationship = isCustomRelationship;
    }

    public bool Equals(DataverseRelationship other)
    {
        if (other is null)
            return false;

        return Id.Equals(other.Id);
    }

    public override bool Equals(object obj)
    {
        if (obj is null)
            return false;

        if (ReferenceEquals(this, obj))
            return true;

        if (obj.GetType() != GetType())
            return false;

        return Equals((DataverseRelationship)obj);
    }

    public override int GetHashCode()
    {
        return Id.GetHashCode();
    }
}
