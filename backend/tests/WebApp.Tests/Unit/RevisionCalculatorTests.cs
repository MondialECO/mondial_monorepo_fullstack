using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

// Module 2 (canon §6.4). Proves the revision-remaining formula in isolation; Module 4
// supplies the live purchased/used counts.
public class RevisionCalculatorTests
{
    [Theory]
    [InlineData(2, 1, 2, 1)]   // canon example: 2 included + 1 purchased − 2 used = 1
    [InlineData(3, 0, 3, 0)]
    [InlineData(1, 0, 0, 1)]
    [InlineData(2, 2, 1, 3)]
    public void Remaining_matches_the_canon_formula(int included, int purchased, int used, int expected)
        => RevisionCalculator.Remaining(included, purchased, used).Should().Be(expected);

    [Fact]
    public void HasRemaining_is_always_true_when_unlimited()
        => RevisionCalculator.HasRemaining(unlimitedRevisions: true, 0, 0, 99).Should().BeTrue();

    [Fact]
    public void HasRemaining_is_false_when_entitlement_exhausted()
        => RevisionCalculator.HasRemaining(false, includedRevisionCount: 2, purchasedAdditionalRevisions: 1, usedRevisionCount: 3).Should().BeFalse();

    [Fact]
    public void HasRemaining_is_true_when_some_left()
        => RevisionCalculator.HasRemaining(false, 2, 1, 2).Should().BeTrue();
}
