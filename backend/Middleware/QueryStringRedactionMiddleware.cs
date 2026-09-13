using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.WebUtilities;

namespace WebApp.Middleware
{
    /// <summary>
    /// Security middleware to redact sensitive query parameters (such as SignalR access_token)
    /// from the request URL/QueryString so they never appear in application request logs or Serilog events.
    /// The raw token is safely stored in HttpContext.Items["access_token"] so authentication continues to function.
    /// </summary>
    public class QueryStringRedactionMiddleware
    {
        private readonly RequestDelegate _next;
        public const string AccessTokenItemKey = "access_token";
        public const string RedactedPlaceholder = "[REDACTED]";

        public QueryStringRedactionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Query.ContainsKey("access_token"))
            {
                var token = context.Request.Query["access_token"].ToString();
                if (!string.IsNullOrEmpty(token) && !token.Equals(RedactedPlaceholder, StringComparison.OrdinalIgnoreCase))
                {
                    context.Items[AccessTokenItemKey] = token;

                    var queryCollection = QueryHelpers.ParseQuery(context.Request.QueryString.Value ?? string.Empty);
                    var cleanItems = new List<KeyValuePair<string, string>>();

                    foreach (var kvp in queryCollection)
                    {
                        if (kvp.Key.Equals("access_token", StringComparison.OrdinalIgnoreCase))
                        {
                            cleanItems.Add(new KeyValuePair<string, string>(kvp.Key, RedactedPlaceholder));
                        }
                        else
                        {
                            foreach (var val in kvp.Value)
                            {
                                cleanItems.Add(new KeyValuePair<string, string>(kvp.Key, val ?? string.Empty));
                            }
                        }
                    }

                    context.Request.QueryString = new QueryBuilder(cleanItems).ToQueryString();
                }
            }

            await _next(context);
        }
    }
}
