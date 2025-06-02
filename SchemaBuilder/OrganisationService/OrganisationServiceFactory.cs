using System;
using Microsoft.Extensions.Logging;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using SchemaBuilder.Config;

namespace SchemaBuilder.OrganisationService
{
    /// <summary>
    /// Factory class for creating connections to Microsoft Dataverse.
    /// </summary>
    /// <remarks>
    /// This class provides a centralized way to create and configure Dataverse
    /// service connections
    /// using service principal authentication (client ID and secret).
    /// </remarks>
    internal static class OrganisationServiceFactory
    {
        /// <summary>
        /// Creates and initializes a connection to Microsoft Dataverse.
        /// </summary>
        /// <param name="appConfig">
        /// The application configuration containing connection parameters.
        /// </param>
        /// <param name="logger">
        /// The logger used for connection diagnostics.
        /// </param>
        /// <returns>
        /// A fully initialized implementation of
        /// <see cref="IOrganizationService"/> that can be used to perform
        /// operations against Microsoft Dataverse.
        /// </returns>
        /// <exception cref="Exception">
        /// Thrown when a connection cannot be established to the Dataverse
        /// instance.
        /// </exception>
        public static IOrganizationService Build(IAppConfig appConfig, ILogger logger)
        {
            var useUniqueInstance = false;

            ServiceClient serviceClient = new ServiceClient(
                appConfig.InstanceUri,
                appConfig.ClientId,
                appConfig.ClientSecret,
                useUniqueInstance,
                logger
            );

            if (!serviceClient.IsReady)
            {
                throw new Exception($"Failed to connect: {serviceClient.LastError}");
            }

            return serviceClient;
        }
    }
}
