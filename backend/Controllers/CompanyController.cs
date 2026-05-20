using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MongoDbContext _context;

        public CompanyController(
            UserManager<ApplicationUser> userManager,
            MongoDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // GET: api/company/current
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentCompany()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            return Ok(new { success = true, data = company });
        }

        // POST: api/company/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateCompany()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var existingCompany = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (existingCompany != null)
                return BadRequest(new { message = "Company already exists for this user" });

            var newCompany = new companies
            {
                OwnerId = user.Id.ToString(),
                VerificationStatus = "pending",
                VerifiedBadge = false,
                Phase = new PhaseState { Current = 2, Completed = new List<int> { 1 } },
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };

            await _context.companies.InsertOneAsync(newCompany);
            return Ok(new { success = true, data = newCompany });
        }

        // PUT: api/company/legal-info
        [HttpPut("legal-info")]
        public async Task<IActionResult> UpdateLegalInfo([FromBody] LegalInfo legalInfo)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            var update = Builders<companies>.Update
                .Set(c => c.Legal, legalInfo)
                .Set(c => c.UpdatedAt, System.DateTime.UtcNow);

            await _context.companies.UpdateOneAsync(
                c => c.Id == company.Id,
                update);

            return Ok(new { success = true, message = "Legal info updated" });
        }

        // POST: api/company/documents/upload
        [HttpPost("documents/upload")]
        public async Task<IActionResult> UploadDocument([FromForm] string docType, IFormFile file)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            // For now, store mock S3 key; in production use actual S3
            var document = new CompanyDocument
            {
                DocType = docType,
                FileName = file.FileName,
                S3Key = $"companies/{company.Id}/{docType}/{file.FileName}",
                Status = "pending",
                UploadedAt = System.DateTime.UtcNow
            };

            var update = Builders<companies>.Update
                .Push(c => c.Documents, document)
                .Set(c => c.UpdatedAt, System.DateTime.UtcNow);

            await _context.companies.UpdateOneAsync(
                c => c.Id == company.Id,
                update);

            return Ok(new { success = true, message = "Document uploaded", data = document });
        }

        // GET: api/company/documents
        [HttpGet("documents")]
        public async Task<IActionResult> GetDocuments()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            return Ok(new { success = true, data = company.Documents ?? new List<CompanyDocument>() });
        }

        // PUT: api/company/beneficial-owners
        [HttpPut("beneficial-owners")]
        public async Task<IActionResult> UpdateBeneficialOwners([FromBody] List<BeneficialOwner> owners)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            var update = Builders<companies>.Update
                .Set(c => c.BeneficialOwners, owners)
                .Set(c => c.UpdatedAt, System.DateTime.UtcNow);

            await _context.companies.UpdateOneAsync(
                c => c.Id == company.Id,
                update);

            return Ok(new { success = true, message = "Beneficial owners updated" });
        }

        // PUT: api/company/phase
        [HttpPut("phase")]
        public async Task<IActionResult> UpdatePhase([FromBody] UpdatePhaseRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            var phaseState = company.Phase;
            if (request.MarkAsCompleted && !phaseState.Completed.Contains(request.Phase))
            {
                phaseState.Completed.Add(request.Phase);
                phaseState.History.Add(new PhaseHistory
                {
                    Phase = request.Phase,
                    CompletedAt = System.DateTime.UtcNow
                });
            }

            if (request.MoveToPhase > phaseState.Current)
            {
                phaseState.Current = request.MoveToPhase;
            }

            var update = Builders<companies>.Update
                .Set(c => c.Phase, phaseState)
                .Set(c => c.UpdatedAt, System.DateTime.UtcNow);

            await _context.companies.UpdateOneAsync(
                c => c.Id == company.Id,
                update);

            return Ok(new { success = true, message = "Phase updated", data = phaseState });
        }

        // GET: api/company/progress
        [HttpGet("progress")]
        public async Task<IActionResult> GetProgress()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var company = await _context.companies
                .Find(c => c.OwnerId == user.Id.ToString())
                .FirstOrDefaultAsync();

            if (company == null)
                return NotFound(new { message = "Company not found" });

            var completionPercentage = CalculateCompletionPercentage(company);

            return Ok(new
            {
                success = true,
                data = new
                {
                    currentPhase = company.Phase.Current,
                    completedPhases = company.Phase.Completed,
                    completionPercentage = completionPercentage,
                    legal = company.Legal,
                    documentsCount = company.Documents.Count,
                    ownersCount = company.BeneficialOwners.Count,
                    verificationStatus = company.VerificationStatus,
                    verifiedBadge = company.VerifiedBadge
                }
            });
        }

        private int CalculateCompletionPercentage(companies company)
        {
            var criteria = 0;
            var totalCriteria = 4;

            if (company.Legal != null && !string.IsNullOrEmpty(company.Legal.LegalName))
                criteria++;

            if (company.Documents.Count >= 4)
                criteria++;

            if (company.BeneficialOwners.Count > 0)
                criteria++;

            if (company.VerificationStatus == "verified")
                criteria++;

            return (criteria * 100) / totalCriteria;
        }

        public class UpdatePhaseRequest
        {
            public int Phase { get; set; }
            public int MoveToPhase { get; set; } = 0;
            public bool MarkAsCompleted { get; set; } = false;
        }
    }
}
