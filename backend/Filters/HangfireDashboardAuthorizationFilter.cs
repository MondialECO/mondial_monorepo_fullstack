using Hangfire.Dashboard;

namespace WebApp.Filters
{
    /// <summary>
    /// Restricts the Hangfire dashboard (/hangfire) to authenticated users in
    /// the "Admin" role. The dashboard is mounted after UseAuthentication /
    /// UseAuthorization so <c>HttpContext.User</c> is populated here.
    /// </summary>
    public class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            var user = context.GetHttpContext().User;
            return user?.Identity?.IsAuthenticated == true && user.IsInRole("Admin");
        }
    }
}
