using System;
using dotenv.net;
using dotenv.net.Utilities;

namespace SchemaBuilder.Config
{
    /// <summary>
    /// Provides configuration settings for Dataverse service connections by
    /// loading values from environment variables.
    /// </summary>
    /// <remarks>
    /// This class loads configuration from a .env file and provides access to
    /// connection parameters for authenticating with Microsoft Dataverse using
    /// a service principal.
    /// </remarks>
    internal class AppConfig : IAppConfig
    {
        /// <summary>
        /// Gets the client ID (application ID) for the EntraID application
        /// registration.
        /// </summary>
        public string ClientId { get; }

        /// <summary>
        /// Gets the client secret for the EntraID application registration.
        /// </summary>
        public string ClientSecret { get; }

        /// <summary>
        /// Gets the URI of the Dataverse instance to connect to.
        /// </summary>
        public Uri InstanceUri { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AppConfig"/> class.
        /// </summary>
        /// <param name="dotEnvPath">The path to the .env file containing
        /// configuration settings.</param>
        /// <exception cref="ApplicationException">
        /// Thrown when the configuration cannot be loaded or when required
        /// environment variables are missing.
        /// </exception>
        internal AppConfig(string dotEnvPath)
        {
            try
            {
                DotEnv
                    .Fluent()
                    .WithExceptions()
                    .WithEnvFiles(dotEnvPath)
                    .WithoutProbeForEnv()
                    .WithTrimValues()
                    .Load();

                ClientId = EnvReader.GetStringValue("CLIENT_ID");
                ClientSecret = EnvReader.GetStringValue("CLIENT_SECRET");
                string instanceUrl = EnvReader.GetStringValue("INSTANCE_URL");
                InstanceUri = new Uri(instanceUrl);
            }
            catch (Exception ex)
            {
                throw new ApplicationException(
                    $"Failed to load application configuration: {ex.Message}",
                    ex
                );
            }
        }
    }
}
