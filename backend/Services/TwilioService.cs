using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace WebApp.Services
{
    public class TwilioService
    {
        private readonly bool _enabled;
        private readonly bool _isConfigured;
        private readonly string? _accountSid;
        private readonly string? _authToken;
        private readonly string? _fromNumber;
        private readonly ILogger<TwilioService> _logger;

        public TwilioService(IConfiguration config, ILogger<TwilioService> logger)
        {
            _logger = logger;
            _enabled = config.GetValue("Twilio:Enabled", false);
            _accountSid = config["Twilio:AccountSid"]?.Trim();
            _authToken = config["Twilio:AuthToken"]?.Trim();
            _fromNumber = config["Twilio:FromNumber"]?.Trim();
            _isConfigured = !string.IsNullOrWhiteSpace(_accountSid) &&
                            !string.IsNullOrWhiteSpace(_authToken) &&
                            !string.IsNullOrWhiteSpace(_fromNumber);

            if (_enabled && _isConfigured)
            {
                TwilioClient.Init(_accountSid, _authToken);
            }
        }

        public async Task SendSmsAsync(string to, string message)
        {
            if (!_enabled)
            {
                _logger.LogInformation("Twilio SMS is disabled (Twilio:Enabled=false). Skipping SMS send.");
                return;
            }

            if (!_isConfigured)
            {
                _logger.LogWarning("Twilio SMS is enabled but credentials are incomplete. Skipping SMS send.");
                return;
            }

            await MessageResource.CreateAsync(
                to: new PhoneNumber(to),
                from: new PhoneNumber(_fromNumber!),
                body: message
            );
        }
    }
}
