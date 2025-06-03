using System;
using System.Collections.Generic;
using System.IO;

namespace SchemaBuilder.Config
{
    /// <summary>
    /// Provides configuration settings for Dataverse service connections by
    /// loading values from environment variables.
    /// </summary>
    internal class AppConfig : IAppConfig
    {
        /// <summary>
        /// Gets the client ID (application ID) for the EntraID application
        /// registration.
        /// </summary>
        public string ClientId { get; private set; }

        /// <summary>
        /// Gets the client secret for the EntraID application registration.
        /// </summary>
        public string ClientSecret { get; private set; }

        /// <summary>
        /// Gets the URI of the Dataverse instance to connect to.
        /// </summary>
        public Uri InstanceUri { get; private set; }

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
                var envVars = LoadEnvironmentVariables(dotEnvPath);

                ClientId = GetStringValue(envVars, "CLIENT_ID");
                ClientSecret = GetStringValue(envVars, "CLIENT_SECRET");
                InstanceUri = new Uri(GetStringValue(envVars, "INSTANCE_URL"));
            }
            catch (Exception ex) when (!(ex is ApplicationException))
            {
                throw new ApplicationException(
                    $"Failed to load application configuration: {ex.Message}",
                    ex
                );
            }
        }

        /// <summary>
        /// Loads environment variables from a .env file.
        /// </summary>
        /// <param name="filePath">The path to the .env file.</param>
        /// <returns>A dictionary containing the environment variables.</returns>
        private Dictionary<string, string> LoadEnvironmentVariables(string filePath)
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"Environment file not found at {filePath}");

            var envVars = new Dictionary<string, string>();

            // Read all lines from the .env file
            string[] lines = File.ReadAllLines(filePath);

            foreach (var line in lines)
            {
                if (string.IsNullOrEmpty(line))
                {
                    continue;
                }

                int equalSignIndex = line.IndexOf('=');
                if (equalSignIndex <= 0)
                {
                    continue;
                }

                string key = line.Substring(0, equalSignIndex).Trim();
                string value = line.Substring(equalSignIndex + 1).Trim();

                envVars[key] = value;
            }

            return envVars;
        }

        /// <summary>
        /// Gets a string value from the environment variables.
        /// </summary>
        private string GetStringValue(Dictionary<string, string> envVars, string key)
        {
            if (!envVars.TryGetValue(key, out string value) || string.IsNullOrEmpty(value))
                throw new ApplicationException(
                    $"Required environment variable {key} is missing or empty"
                );

            return value;
        }
    }
}
