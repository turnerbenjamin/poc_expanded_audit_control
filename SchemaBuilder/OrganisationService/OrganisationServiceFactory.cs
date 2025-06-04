using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Identity.Client;
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
        public static IOrganizationService Build(Config.IAppConfig appConfig, ILogger logger)
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

        /// <summary>
        /// Creates and initializes a connection to Microsoft Dataverse using
        /// interactive authentication.
        /// </summary>
        /// <param name="appConfig">The application configuration containing
        /// connection parameters.
        /// </param>
        /// <param name="logger">
        /// The logger used for connection diagnostics.
        /// </param>
        /// <returns>
        /// A fully initialized implementation of IOrganizationService.
        /// </returns>
        /// <exception cref="Exception">Thrown when authentication fails or
        /// connection cannot be established.
        /// </exception>
        public static async Task<IOrganizationService> BuildWithInteractiveAuth(
            string instanceUri,
            ILogger logger
        )
        {
            // This is an id provided by microsoft for development purposes to
            // simplify connection to Dataverse

            // https://learn.microsoft.com/en-us/power-apps/developer/data-platform/xrm-tooling/use-connection-strings-xrm-tooling-connect
            var powerPlatformClientId = "51f81489-12ee-4a9e-aaae-a2591f45987d";
            try
            {
                var publicClientApp = PublicClientApplicationBuilder
                    .Create(powerPlatformClientId)
                    .WithRedirectUri("http://localhost")
                    .WithAuthority(AzureCloudInstance.AzurePublic, "common")
                    .Build();

                var scopes = new[]
                {
                    $"{instanceUri}{(instanceUri.EndsWith("/") ? "" : "/")}.default",
                };

                AuthenticationResult authResult;

                // Attempt silent log-in
                try
                {
                    var accounts = await publicClientApp.GetAccountsAsync();
                    authResult = await publicClientApp
                        .AcquireTokenSilent(scopes, accounts.FirstOrDefault())
                        .ExecuteAsync();
                }
                // Use interactive log-in if unsuccessful
                catch (MsalUiRequiredException)
                {
                    authResult = await publicClientApp
                        .AcquireTokenInteractive(scopes)
                        .WithPrompt(Prompt.SelectAccount)
                        .ExecuteAsync();
                }

                // Connect to Dataverse Online
                var serviceClient = new ServiceClient(
                    new Uri(instanceUri),
                    authority => Task.FromResult(authResult.AccessToken),
                    true,
                    logger
                );

                if (!serviceClient.IsReady)
                {
                    throw new Exception($"Failed to connect: {serviceClient.LastError}");
                }

                logger.LogInformation("Connected successfully to Dataverse");
                return serviceClient;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during interactive authentication");
                throw new Exception("Failed to authenticate using interactive browser login", ex);
            }
        }
    }
}
