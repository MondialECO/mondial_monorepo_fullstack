using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Reflection;
using WebApp.E2eSupport;
using WebApp.E2eSupport.Controllers;
using WebApp.Services.E2e;
using Xunit;

namespace WebApp.Tests.Unit;

public class E2eEnvironmentTests
{
    [Fact]
    public void IsEnabled_requires_the_exact_E2E_environment_name()
    {
        var environment = new Mock<IWebHostEnvironment>();

        environment.SetupGet(x => x.EnvironmentName).Returns("Production");
        Assert.False(E2eEnvironment.IsEnabled(environment.Object));

        environment.SetupGet(x => x.EnvironmentName).Returns("Development");
        Assert.False(E2eEnvironment.IsEnabled(environment.Object));

        environment.SetupGet(x => x.EnvironmentName).Returns(E2eEnvironment.Name);
        Assert.True(E2eEnvironment.IsEnabled(environment.Object));
    }

    [Fact]
    public async Task E2e_creator_factory_is_not_available_outside_E2E()
    {
        var environment = new Mock<IWebHostEnvironment>();
        environment.SetupGet(x => x.EnvironmentName).Returns("Production");
        var controller = new E2eCreatorTestController(
            environment.Object, null!, null!, null!, null!);

        var result = await controller.Create(new E2eCreatorTestController.E2eCreatorRequest
        {
            Fixture = "CreatorBasic",
        });

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public void E2e_controller_is_compiled_into_test_support_not_the_web_assembly()
    {
        Assert.NotEqual(typeof(Program).Assembly, typeof(E2eSupportAssembly).Assembly);
        Assert.Equal(typeof(E2eSupportAssembly).Assembly, typeof(E2eCreatorTestController).Assembly);
    }
}
