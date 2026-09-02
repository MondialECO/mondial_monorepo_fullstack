using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/admin/data-governance")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminDataGovernanceController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly IAuditLogger? _audit;

        public AdminDataGovernanceController(
            MongoDbContext context,
            IAuditLogger? audit = null)
        {
            _context = context;
            _audit = audit;
        }

        // GET /api/admin/data-governance/inventory (SuperAdmin only: 200)
        [HttpGet("inventory")]
        public async Task<IActionResult> GetDataGovernanceInventory()
        {
            var userCount = _context.ApplicationUsers != null ? await _context.ApplicationUsers.CountDocumentsAsync(Builders<ApplicationUser>.Filter.Empty) : 0;
            var auditCount = _context.AdminAuditLogs != null ? await _context.AdminAuditLogs.CountDocumentsAsync(Builders<AdminAuditLog>.Filter.Empty) : 0;
            var reportCount = _context.ContentReports != null ? await _context.ContentReports.CountDocumentsAsync(Builders<ContentReport>.Filter.Empty) : 0;
            var txnCount = _context.FinancialTransactions != null ? await _context.FinancialTransactions.CountDocumentsAsync(Builders<FinancialTransaction>.Filter.Empty) : 0;
            var engagementCount = _context.WorkroomEngagements != null ? await _context.WorkroomEngagements.CountDocumentsAsync(Builders<WorkroomEngagement>.Filter.Empty) : 0;
            var msgCount = _context.ChatMessages != null ? await _context.ChatMessages.CountDocumentsAsync(Builders<ChatMessage>.Filter.Empty) : 0;
            var notifCount = _context.Notifications != null ? await _context.Notifications.CountDocumentsAsync(Builders<Notification>.Filter.Empty) : 0;
            var privacyReqCount = _context.PrivacyRequests != null ? await _context.PrivacyRequests.CountDocumentsAsync(Builders<PrivacyRequest>.Filter.Empty) : 0;
            var listingCount = _context.ServiceListings != null ? await _context.ServiceListings.CountDocumentsAsync(Builders<ServiceListing>.Filter.Empty) : 0;

            var policies = _context.DataRetentionPolicies != null ? await _context.DataRetentionPolicies.Find(_ => true).ToListAsync() : new List<DataRetentionPolicy>();
            var policyMap = policies.ToDictionary(p => p.DataCategory, p => p, StringComparer.OrdinalIgnoreCase);

            var categories = new List<DataGovernanceInventoryItemDto>
            {
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "ApplicationUsers",
                    StorageAuthority = "MongoDB ApplicationUsers",
                    DataSensitivity = "RestrictedPII",
                    RetentionPolicy = policyMap.TryGetValue("ApplicationUsers", out var u) && u.RetentionDays.HasValue ? $"{u.RetentionDays} days" : "Indefinite / Account Lifetime",
                    DeletionStrategy = policyMap.TryGetValue("ApplicationUsers", out var u2) ? u2.ActionAfterRetention : "Anonymize",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = userCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "KYCEvidence",
                    StorageAuthority = "Protected Storage (Encrypted)",
                    DataSensitivity = "RestrictedPII",
                    RetentionPolicy = policyMap.TryGetValue("KYCEvidence", out var k) && k.RetentionDays.HasValue ? $"{k.RetentionDays} days" : "5 Years (Regulatory Hold)",
                    DeletionStrategy = policyMap.TryGetValue("KYCEvidence", out var k2) ? k2.ActionAfterRetention : "ReviewOnly",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = userCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "InvestorFinanceEvidence",
                    StorageAuthority = "Protected Storage (Encrypted)",
                    DataSensitivity = "FinancialRegulatory",
                    RetentionPolicy = policyMap.TryGetValue("InvestorFinanceEvidence", out var inv) && inv.RetentionDays.HasValue ? $"{inv.RetentionDays} days" : "7 Years (AML/KYC Hold)",
                    DeletionStrategy = policyMap.TryGetValue("InvestorFinanceEvidence", out var inv2) ? inv2.ActionAfterRetention : "Archive",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = userCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "ServiceProviderCredentials",
                    StorageAuthority = "Protected Storage (Encrypted)",
                    DataSensitivity = "Confidential",
                    RetentionPolicy = policyMap.TryGetValue("ServiceProviderCredentials", out var sp) && sp.RetentionDays.HasValue ? $"{sp.RetentionDays} days" : "Indefinite / Active Provider",
                    DeletionStrategy = policyMap.TryGetValue("ServiceProviderCredentials", out var sp2) ? sp2.ActionAfterRetention : "ReviewOnly",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = listingCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "AuditLogs",
                    StorageAuthority = "MongoDB AdminAuditLogs (Append-Only)",
                    DataSensitivity = "Confidential",
                    RetentionPolicy = policyMap.TryGetValue("AuditLogs", out var al) && al.RetentionDays.HasValue ? $"{al.RetentionDays} days" : "365 Days (Immutable Security Trail)",
                    DeletionStrategy = policyMap.TryGetValue("AuditLogs", out var al2) ? al2.ActionAfterRetention : "Archive",
                    AccessAuthority = "Admin, SuperAdmin, System",
                    EstimatedRecordsCount = auditCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "ContentReports",
                    StorageAuthority = "MongoDB ContentReports",
                    DataSensitivity = "Internal",
                    RetentionPolicy = policyMap.TryGetValue("ContentReports", out var rep) && rep.RetentionDays.HasValue ? $"{rep.RetentionDays} days" : "180 Days",
                    DeletionStrategy = policyMap.TryGetValue("ContentReports", out var rep2) ? rep2.ActionAfterRetention : "Archive",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = reportCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "FinancialTransactions",
                    StorageAuthority = "MongoDB FinancialTransactions (Immutable Ledger)",
                    DataSensitivity = "FinancialRegulatory",
                    RetentionPolicy = policyMap.TryGetValue("FinancialTransactions", out var ft) && ft.RetentionDays.HasValue ? $"{ft.RetentionDays} days" : "7 Years (Tax/Statutory Hold)",
                    DeletionStrategy = policyMap.TryGetValue("FinancialTransactions", out var ft2) ? ft2.ActionAfterRetention : "Archive",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = txnCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "WorkroomRecords",
                    StorageAuthority = "MongoDB WorkroomEngagements",
                    DataSensitivity = "Confidential",
                    RetentionPolicy = policyMap.TryGetValue("WorkroomRecords", out var wr) && wr.RetentionDays.HasValue ? $"{wr.RetentionDays} days" : "3 Years post-completion",
                    DeletionStrategy = policyMap.TryGetValue("WorkroomRecords", out var wr2) ? wr2.ActionAfterRetention : "Archive",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = engagementCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "ChatMessages",
                    StorageAuthority = "MongoDB ChatMessages",
                    DataSensitivity = "Confidential",
                    RetentionPolicy = policyMap.TryGetValue("ChatMessages", out var cm) && cm.RetentionDays.HasValue ? $"{cm.RetentionDays} days" : "365 Days",
                    DeletionStrategy = policyMap.TryGetValue("ChatMessages", out var cm2) ? cm2.ActionAfterRetention : "Delete",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = msgCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "Notifications",
                    StorageAuthority = "MongoDB Notifications",
                    DataSensitivity = "Internal",
                    RetentionPolicy = policyMap.TryGetValue("Notifications", out var not) && not.RetentionDays.HasValue ? $"{not.RetentionDays} days" : "90 Days",
                    DeletionStrategy = policyMap.TryGetValue("Notifications", out var not2) ? not2.ActionAfterRetention : "Delete",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = notifCount
                },
                new DataGovernanceInventoryItemDto
                {
                    DataCategory = "PrivacyRequests",
                    StorageAuthority = "MongoDB PrivacyRequests",
                    DataSensitivity = "RestrictedPII",
                    RetentionPolicy = policyMap.TryGetValue("PrivacyRequests", out var pr) && pr.RetentionDays.HasValue ? $"{pr.RetentionDays} days" : "2 Years (Compliance Trail)",
                    DeletionStrategy = policyMap.TryGetValue("PrivacyRequests", out var pr2) ? pr2.ActionAfterRetention : "ReviewOnly",
                    AccessAuthority = "Admin, SuperAdmin",
                    EstimatedRecordsCount = privacyReqCount
                }
            };

            return Ok(ApiResponse.Ok("Data governance inventory retrieved", categories));
        }

        // GET /api/admin/data-governance/settings (SUPERADMIN ONLY: 200, Normal Admin: 403)
        [HttpGet("settings")]
        public async Task<IActionResult> GetRetentionSettings()
        {
            var policies = await _context.DataRetentionPolicies.Find(_ => true).ToListAsync();

            if (!policies.Any())
            {
                // Seed default catalog if empty
                policies = GetDefaultRetentionPolicies();
                await _context.DataRetentionPolicies.InsertManyAsync(policies);
            }

            var dtos = policies.Select(MapPolicyToDto).ToList();
            return Ok(ApiResponse.Ok("Retention policy settings retrieved", dtos));
        }

        // PUT /api/admin/data-governance/settings (SUPERADMIN ONLY: 200, Normal Admin: 403)
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateRetentionSettings([FromBody] UpdateDataRetentionPolicyRequest request)
        {
            var adminActor = User.Identity?.Name ?? "superadmin";

            foreach (var dto in request.Policies)
            {
                var existing = await _context.DataRetentionPolicies
                    .Find(p => p.DataCategory == dto.DataCategory || p.Id == dto.Id)
                    .FirstOrDefaultAsync();

                if (existing != null)
                {
                    // Optimistic concurrency check: 409 if version mismatch
                    if (existing.Version != dto.Version)
                    {
                        return Conflict(ApiResponse.Error($"Retention policy for {dto.DataCategory} was modified by another administrator. Please refresh."));
                    }

                    existing.RetentionDays = dto.RetentionDays;
                    existing.ActionAfterRetention = dto.ActionAfterRetention ?? existing.ActionAfterRetention;
                    existing.Enabled = dto.Enabled;
                    existing.UpdatedBy = adminActor;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.Version++;

                    await _context.DataRetentionPolicies.ReplaceOneAsync(p => p.Id == existing.Id, existing);
                }
                else
                {
                    var newPolicy = new DataRetentionPolicy
                    {
                        DataCategory = dto.DataCategory,
                        RetentionDays = dto.RetentionDays,
                        ActionAfterRetention = dto.ActionAfterRetention ?? "ReviewOnly",
                        StorageAuthority = dto.StorageAuthority ?? "MongoDB",
                        DataSensitivity = dto.DataSensitivity ?? "Internal",
                        AccessAuthority = dto.AccessAuthority ?? "Admin",
                        Enabled = dto.Enabled,
                        UpdatedBy = adminActor,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _context.DataRetentionPolicies.InsertOneAsync(newPolicy);
                }
            }

            _audit?.Record("superadmin_retention_policy_updated", adminActor, true, new
            {
                policyCount = request.Policies.Count,
                updatedBy = adminActor
            });

            var updatedPolicies = await _context.DataRetentionPolicies.Find(_ => true).ToListAsync();
            return Ok(ApiResponse.Ok("Retention policy settings updated successfully", updatedPolicies.Select(MapPolicyToDto).ToList()));
        }

        private static List<DataRetentionPolicy> GetDefaultRetentionPolicies()
        {
            return new List<DataRetentionPolicy>
            {
                new DataRetentionPolicy { DataCategory = "ApplicationUsers", RetentionDays = null, ActionAfterRetention = "Anonymize", DataSensitivity = "RestrictedPII" },
                new DataRetentionPolicy { DataCategory = "KYCEvidence", RetentionDays = 1825, ActionAfterRetention = "ReviewOnly", DataSensitivity = "RestrictedPII" },
                new DataRetentionPolicy { DataCategory = "InvestorFinanceEvidence", RetentionDays = 2555, ActionAfterRetention = "Archive", DataSensitivity = "FinancialRegulatory" },
                new DataRetentionPolicy { DataCategory = "ServiceProviderCredentials", RetentionDays = null, ActionAfterRetention = "ReviewOnly", DataSensitivity = "Confidential" },
                new DataRetentionPolicy { DataCategory = "AuditLogs", RetentionDays = 365, ActionAfterRetention = "Archive", DataSensitivity = "Confidential" },
                new DataRetentionPolicy { DataCategory = "ContentReports", RetentionDays = 180, ActionAfterRetention = "Archive", DataSensitivity = "Internal" },
                new DataRetentionPolicy { DataCategory = "FinancialTransactions", RetentionDays = 2555, ActionAfterRetention = "Archive", DataSensitivity = "FinancialRegulatory" },
                new DataRetentionPolicy { DataCategory = "WorkroomRecords", RetentionDays = 1095, ActionAfterRetention = "Archive", DataSensitivity = "Confidential" },
                new DataRetentionPolicy { DataCategory = "ChatMessages", RetentionDays = 365, ActionAfterRetention = "Delete", DataSensitivity = "Confidential" },
                new DataRetentionPolicy { DataCategory = "Notifications", RetentionDays = 90, ActionAfterRetention = "Delete", DataSensitivity = "Internal" },
                new DataRetentionPolicy { DataCategory = "PrivacyRequests", RetentionDays = 730, ActionAfterRetention = "ReviewOnly", DataSensitivity = "RestrictedPII" },
            };
        }

        private static DataRetentionPolicyDto MapPolicyToDto(DataRetentionPolicy p)
        {
            return new DataRetentionPolicyDto
            {
                Id = p.Id,
                DataCategory = p.DataCategory,
                RetentionDays = p.RetentionDays,
                ActionAfterRetention = p.ActionAfterRetention,
                StorageAuthority = p.StorageAuthority,
                DataSensitivity = p.DataSensitivity,
                AccessAuthority = p.AccessAuthority,
                Enabled = p.Enabled,
                UpdatedBy = p.UpdatedBy,
                UpdatedAt = p.UpdatedAt,
                Version = p.Version
            };
        }
    }
}
