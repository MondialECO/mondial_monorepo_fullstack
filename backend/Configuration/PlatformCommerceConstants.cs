namespace WebApp.Configuration;

/// <summary>Shared commercial policy values used across marketplace modules.</summary>
public static class PlatformCommerceConstants
{
    /// <summary>
    /// Flat platform commission. Module 3 uses this for previews only; Module 4 must
    /// consume this same value when releasing payment and must never redefine it.
    /// </summary>
    public const decimal CommissionRate = 0.12m;
}
