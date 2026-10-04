using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class CompanySearchService : ICompanySearchService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<CompanySearchService> _logger;

        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);
        private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(5);

        public CompanySearchService(
            HttpClient httpClient,
            IMemoryCache memoryCache,
            ILogger<CompanySearchService> logger)
        {
            _httpClient = httpClient;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        public async Task<CompanySearchResponseDto> SearchCompaniesAsync(string query, int limit = 5, CancellationToken cancellationToken = default)
        {
            var trimmedQuery = (query ?? string.Empty).Trim();
            if (trimmedQuery.Length < 2)
            {
                return new CompanySearchResponseDto
                {
                    Query = trimmedQuery,
                    Matches = new List<CompanySearchMatchDto>(),
                    TotalResults = 0
                };
            }

            if (trimmedQuery.Length > 80)
            {
                throw new ArgumentException("Search query exceeds maximum allowed length of 80 characters.", nameof(query));
            }

            var boundedLimit = Math.Clamp(limit, 1, 10);
            var cacheKey = $"company_search:{trimmedQuery.ToLowerInvariant()}:{boundedLimit}";

            if (_memoryCache.TryGetValue(cacheKey, out CompanySearchResponseDto? cachedResponse) && cachedResponse != null)
            {
                return cachedResponse;
            }

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(DefaultTimeout);

            var encodedQuery = Uri.EscapeDataString(trimmedQuery);
            var url = $"search?q={encodedQuery}&per_page={boundedLimit}";

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync(url, cts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("Recherche d'entreprises API timed out after {TimeoutMs}ms for query: {Query}", DefaultTimeout.TotalMilliseconds, trimmedQuery);
                throw new TimeoutException("The external company search service timed out.");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed to connect to Recherche d'entreprises API for query: {Query}", trimmedQuery);
                throw new HttpRequestException("Failed to communicate with the company search provider.", ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                var statusCode = (int)response.StatusCode;
                _logger.LogWarning("Recherche d'entreprises API returned error status {StatusCode} for query: {Query}", statusCode, trimmedQuery);
                throw new HttpRequestException($"Company search provider returned error status {statusCode}", null, response.StatusCode);
            }

            var contentStream = await response.Content.ReadAsStreamAsync(cts.Token);
            try
            {
                using var jsonDoc = await JsonDocument.ParseAsync(contentStream, cancellationToken: cts.Token);
                var root = jsonDoc.RootElement;

                var totalResults = 0;
                if (root.TryGetProperty("total_results", out var totalEl) && totalEl.TryGetInt32(out var parsedTotal))
                {
                    totalResults = parsedTotal;
                }

                var matches = new List<CompanySearchMatchDto>();
                if (root.TryGetProperty("results", out var resultsEl) && resultsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in resultsEl.EnumerateArray())
                    {
                        var siren = item.TryGetProperty("siren", out var sirenEl) && sirenEl.ValueKind == JsonValueKind.String
                            ? sirenEl.GetString() ?? string.Empty
                            : string.Empty;

                        var name = string.Empty;
                        if (item.TryGetProperty("nom_complet", out var nomCompletEl) && nomCompletEl.ValueKind == JsonValueKind.String)
                        {
                            name = nomCompletEl.GetString() ?? string.Empty;
                        }
                        if (string.IsNullOrWhiteSpace(name) && item.TryGetProperty("nom_raison_sociale", out var raisonEl) && raisonEl.ValueKind == JsonValueKind.String)
                        {
                            name = raisonEl.GetString() ?? string.Empty;
                        }

                        // Administrative status
                        var status = "unknown";
                        if (item.TryGetProperty("etat_administratif", out var etatEl) && etatEl.ValueKind == JsonValueKind.String)
                        {
                            var etat = etatEl.GetString();
                            if (string.Equals(etat, "A", StringComparison.OrdinalIgnoreCase))
                            {
                                status = "active";
                            }
                            else if (string.Equals(etat, "C", StringComparison.OrdinalIgnoreCase) || string.Equals(etat, "F", StringComparison.OrdinalIgnoreCase))
                            {
                                status = "closed";
                            }
                        }

                        // Activity code (NAF/APE)
                        string? activityCode = null;
                        if (item.TryGetProperty("activite_principale", out var actEl) && actEl.ValueKind == JsonValueKind.String)
                        {
                            activityCode = actEl.GetString();
                        }

                        // Location from headquarters (siege)
                        string? postalCode = null;
                        string? city = null;
                        string? department = null;

                        if (item.TryGetProperty("siege", out var siegeEl) && siegeEl.ValueKind == JsonValueKind.Object)
                        {
                            if (siegeEl.TryGetProperty("code_postal", out var cpEl) && cpEl.ValueKind == JsonValueKind.String)
                            {
                                postalCode = cpEl.GetString();
                            }
                            if (siegeEl.TryGetProperty("libelle_commune", out var cityEl) && cityEl.ValueKind == JsonValueKind.String)
                            {
                                city = cityEl.GetString();
                            }
                            if (siegeEl.TryGetProperty("departement", out var depEl) && depEl.ValueKind == JsonValueKind.String)
                            {
                                department = depEl.GetString();
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(name) || !string.IsNullOrWhiteSpace(siren))
                        {
                            matches.Add(new CompanySearchMatchDto
                            {
                                Siren = siren,
                                Name = string.IsNullOrWhiteSpace(name) ? "Unknown Company" : name,
                                PostalCode = postalCode,
                                City = city,
                                Department = department,
                                ActivityCode = activityCode,
                                Status = status
                            });
                        }
                    }
                }

                var result = new CompanySearchResponseDto
                {
                    Query = trimmedQuery,
                    Matches = matches,
                    TotalResults = totalResults > 0 ? totalResults : matches.Count
                };

                _memoryCache.Set(cacheKey, result, CacheDuration);
                return result;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize Recherche d'entreprises JSON response for query: {Query}", trimmedQuery);
                throw new HttpRequestException("Invalid response received from company search provider.", ex);
            }
        }
    }
}
