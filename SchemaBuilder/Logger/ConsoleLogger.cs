using System;
using Microsoft.Extensions.Logging;

namespace SchemaBuilder.Logger
{
    internal class ConsoleLogger : ILogger
    {
        private ConsoleColor _originalColor = Console.ForegroundColor;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception exception,
            Func<TState, Exception, string> formatter
        )
        {
            Console.ForegroundColor = GetForegroundColor(logLevel);
            Console.WriteLine($"[{DateTime.Now}] {logLevel} {state}");
            Console.ForegroundColor = _originalColor;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            throw new NotImplementedException();
        }

        private ConsoleColor GetForegroundColor(LogLevel logLevel)
        {
            switch (logLevel)
            {
                case LogLevel.Error:
                case LogLevel.Critical:
                    return ConsoleColor.Red;
                case LogLevel.Warning:
                    return ConsoleColor.Yellow;
                default:
                    return ConsoleColor.DarkGray;
            }
        }
    }
}
