using System;

namespace SchemaBuilder.Config
{
    public interface IAppConfig
    {
        string ClientId { get; }
        string ClientSecret { get; }
        Uri InstanceUri { get; }
    }
}
