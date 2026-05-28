//using FluentAssertions;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Extensions.Caching.Distributed;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Moq;
//using WebApp.Controllers;
//using WebApp.Models;
//using WebApp.Models.DatabaseModels;
//using WebApp.Services;
//using WebApp.Services.Audit;
//using Xunit;

//namespace WebApp.Tests.Unit;

///// <summary>
///// Unit tests for AuthController covering all authentication flows:
///// - User registration with role assignment
///// - Login with JWT token generation
///// - Email confirmation
///// - Password reset
///// - Account management
///// </summary>
//public class AuthControllerTests
//{
//    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
//    private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
//    private readonly Mock<RoleManager<ApplicationRole>> _mockRoleManager;
//    private readonly Mock<IConfiguration> _mockConfiguration;
//    private readonly Mock<EmailService> _mockEmailService;
//    private readonly Mock<ILogger<AuthController>> _mockLogger;
//    private readonly Mock<SaveFile> _mockFileService;
//    private readonly Mock<IDistributedCache> _mockCache;
//    private readonly Mock<TwilioService> _mockTwilioService;
//    private readonly Mock<IAuditLogger> _mockAudit;
//    private readonly AuthController _controller;

//    public AuthControllerTests()
//    {
//        _mockUserManager = new Mock<UserManager<ApplicationUser>>(
//            Mock.Of<IUserStore<ApplicationUser>>(), null, null, null, null, null, null, null, null);

//        _mockSignInManager = new Mock<SignInManager<ApplicationUser>>(
//            _mockUserManager.Object, Mock.Of<IHttpContextAccessor>(),
//            Mock.Of<IUserClaimsPrincipalFactory<ApplicationUser>>(), null, null, null, null);

//        _mockRoleManager = new Mock<RoleManager<ApplicationRole>>(
//            Mock.Of<IRoleStore<ApplicationRole>>(), null, null, null, null);

//        _mockConfiguration = new Mock<IConfiguration>();
//        _mockEmailService = new Mock<EmailService>();
//        _mockLogger = new Mock<ILogger<AuthController>>();
//        _mockFileService = new Mock<SaveFile>();
//        _mockCache = new Mock<IDistributedCache>();
//        _mockTwilioService = new Mock<TwilioService>();
//        _mockAudit = new Mock<IAuditLogger>();

//        _controller = new AuthController(
//            _mockUserManager.Object,
//            _mockSignInManager.Object,
//            _mockConfiguration.Object,
//            _mockRoleManager.Object,
//            _mockEmailService.Object,
//            _mockLogger.Object,
//            _mockFileService.Object,
//            _mockCache.Object,
//            _mockTwilioService.Object,
//            _mockAudit.Object
//        );
//    }

//    #region Login Tests

//    [Fact]
//    public async Task Login_WithValidCredentials_ReturnsTokenAndSuccessMessage()
//    {
//        // Arrange
//        var loginModel = new LoginRequestModel
//        {
//            Email = "test@example.com",
//            Password = "ValidPassword123"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            UserName = "testuser",
//            Email = "test@example.com",
//            EmailConfirmed = true,
//            KycStatus = "verified"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(loginModel.Email))
//            .ReturnsAsync(user);

//        _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginModel.Password, false))
//            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);

//        _mockConfiguration.Setup(x => x["JwtSettings:Key"])
//            .Returns(new string('k', 48));
//        _mockConfiguration.Setup(x => x["JwtSettings:Issuer"])
//            .Returns("test-issuer");
//        _mockConfiguration.Setup(x => x["JwtSettings:Audience"])
//            .Returns("test-audience");
//        _mockConfiguration.Setup(x => x["JwtSettings:ExpirationMinutes"])
//            .Returns("60");

//        // Act
//        var result = await _controller.Login(loginModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        var okResult = result as OkObjectResult;
//        okResult?.StatusCode.Should().Be(200);
//    }

//    [Fact]
//    public async Task Login_WithInvalidEmail_ReturnsBadRequest()
//    {
//        // Arrange
//        var loginModel = new LoginRequestModel
//        {
//            Email = "nonexistent@example.com",
//            Password = "ValidPassword123"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(loginModel.Email))
//            .ReturnsAsync((ApplicationUser)null);

//        // Act
//        var result = await _controller.Login(loginModel);

//        // Assert
//        result.Should().BeOfType<UnauthorizedObjectResult>();
//    }

//    [Fact]
//    public async Task Login_WithIncorrectPassword_ReturnsBadRequest()
//    {
//        // Arrange
//        var loginModel = new LoginRequestModel
//        {
//            Email = "test@example.com",
//            Password = "WrongPassword123"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com",
//            EmailConfirmed = true
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(loginModel.Email))
//            .ReturnsAsync(user);

//        _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(user, loginModel.Password, false))
//            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

//        // Act
//        var result = await _controller.Login(loginModel);

//        // Assert
//        result.Should().BeOfType<UnauthorizedObjectResult>();
//    }

//    #endregion

//    #region Register Tests

//    [Fact]
//    public async Task Register_WithValidData_CreatesUserAndAssignsRole()
//    {
//        // Arrange
//        var registerModel = new RegisterModel
//        {
//            Name = "John Doe",
//            Email = "john@example.com",
//            Password = "ValidPassword123",
//            User = "Creator"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(registerModel.Email))
//            .ReturnsAsync((ApplicationUser)null);

//        _mockUserManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerModel.Password))
//            .ReturnsAsync(IdentityResult.Success);

//        _mockRoleManager.Setup(x => x.RoleExistsAsync("Creator"))
//            .ReturnsAsync(true);

//        _mockUserManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Creator"))
//            .ReturnsAsync(IdentityResult.Success);

//        // Act
//        var result = await _controller.Register(registerModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerModel.Password), Times.Once);
//        _mockUserManager.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Creator"), Times.Once);
//    }

//    [Fact]
//    public async Task Register_WithExistingEmail_ReturnsBadRequest()
//    {
//        // Arrange
//        var registerModel = new RegisterModel
//        {
//            Name = "Jane Doe",
//            Email = "existing@example.com",
//            Password = "ValidPassword123",
//            User = "Investor"
//        };

//        var existingUser = new ApplicationUser
//        {
//            Email = "existing@example.com"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(registerModel.Email))
//            .ReturnsAsync(existingUser);

//        // Act
//        var result = await _controller.Register(registerModel);

//        // Assert
//        result.Should().BeOfType<BadRequestObjectResult>();
//        _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
//    }

//    [Fact]
//    public async Task Register_WithInvalidRole_ReturnsBadRequest()
//    {
//        // Arrange
//        var registerModel = new RegisterModel
//        {
//            Name = "Bob Smith",
//            Email = "bob@example.com",
//            Password = "ValidPassword123",
//            User = "InvalidRole"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(registerModel.Email))
//            .ReturnsAsync((ApplicationUser)null);

//        _mockRoleManager.Setup(x => x.RoleExistsAsync("InvalidRole"))
//            .ReturnsAsync(false);

//        // Act
//        var result = await _controller.Register(registerModel);

//        // Assert
//        result.Should().BeOfType<BadRequestObjectResult>();
//    }

//    #endregion

//    #region Email Confirmation Tests

//    [Fact]
//    public async Task ConfirmEmail_WithValidToken_MarksEmailAsConfirmed()
//    {
//        // Arrange
//        var confirmModel = new ConfirmEmailModel
//        {
//            Email = "test@example.com",
//            Token = "valid-token-123"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com",
//            EmailConfirmed = false
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(confirmModel.Email))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.ConfirmEmailAsync(user, confirmModel.Token))
//            .ReturnsAsync(IdentityResult.Success);

//        // Act
//        var result = await _controller.ConfirmEmail(confirmModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        _mockUserManager.Verify(x => x.ConfirmEmailAsync(user, confirmModel.Token), Times.Once);
//    }

//    [Fact]
//    public async Task ConfirmEmail_WithInvalidToken_ReturnsBadRequest()
//    {
//        // Arrange
//        var confirmModel = new ConfirmEmailModel
//        {
//            Email = "test@example.com",
//            Token = "invalid-token-123"
//        };

//        var user = new ApplicationUser
//        {
//            Email = "test@example.com"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(confirmModel.Email))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.ConfirmEmailAsync(user, confirmModel.Token))
//            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalid token" }));

//        // Act
//        var result = await _controller.ConfirmEmail(confirmModel);

//        // Assert
//        result.Should().BeOfType<BadRequestObjectResult>();
//    }

//    [Fact]
//    public async Task ConfirmEmail_WithNonexistentUser_ReturnsNotFound()
//    {
//        // Arrange
//        var confirmModel = new ConfirmEmailModel
//        {
//            Email = "nonexistent@example.com",
//            Token = "token"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(confirmModel.Email))
//            .ReturnsAsync((ApplicationUser)null);

//        // Act
//        var result = await _controller.ConfirmEmail(confirmModel);

//        // Assert
//        result.Should().BeOfType<NotFoundObjectResult>();
//    }

//    #endregion

//    #region Forgot Password Tests

//    [Fact]
//    public async Task ForgotPassword_WithValidEmail_SendsResetEmail()
//    {
//        // Arrange
//        var forgotModel = new ForgotPasswordModel
//        {
//            Email = "test@example.com"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(forgotModel.Email))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.GeneratePasswordResetTokenAsync(user))
//            .ReturnsAsync("reset-token-123");

//        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
//            .Returns(Task.CompletedTask);

//        // Act
//        var result = await _controller.ForgotPassword(forgotModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
//    }

//    [Fact]
//    public async Task ForgotPassword_WithNonexistentEmail_ReturnsNotFound()
//    {
//        // Arrange
//        var forgotModel = new ForgotPasswordModel
//        {
//            Email = "nonexistent@example.com"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(forgotModel.Email))
//            .ReturnsAsync((ApplicationUser)null);

//        // Act
//        var result = await _controller.ForgotPassword(forgotModel);

//        // Assert
//        result.Should().BeOfType<NotFoundObjectResult>();
//        _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
//    }

//    #endregion

//    #region Reset Password Tests

//    [Fact]
//    public async Task ResetPassword_WithValidToken_UpdatesPassword()
//    {
//        // Arrange
//        var resetModel = new ResetPasswordRequestModel
//        {
//            Email = "test@example.com",
//            Token = "reset-token-123",
//            NewPassword = "NewPassword123",
//            ConfirmPassword = "NewPassword123"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com"
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync(resetModel.Email))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.ResetPasswordAsync(user, resetModel.Token, resetModel.NewPassword))
//            .ReturnsAsync(IdentityResult.Success);

//        // Act
//        var result = await _controller.ResetPassword(resetModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        _mockUserManager.Verify(x => x.ResetPasswordAsync(user, resetModel.Token, resetModel.NewPassword), Times.Once);
//    }

//    [Fact]
//    public async Task ResetPassword_WithMismatchedPasswords_ReturnsBadRequest()
//    {
//        // Arrange
//        var resetModel = new ResetPasswordRequestModel
//        {
//            Email = "test@example.com",
//            Token = "reset-token-123",
//            NewPassword = "NewPassword123",
//            ConfirmPassword = "DifferentPassword123"
//        };

//        // Act
//        var result = await _controller.ResetPassword(resetModel);

//        // Assert
//        result.Should().BeOfType<BadRequestObjectResult>();
//        _mockUserManager.Verify(x => x.ResetPasswordAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
//    }

//    #endregion

//    #region Change Password Tests

//    [Fact]
//    public async Task ChangePassword_WithCorrectCurrentPassword_UpdatesPassword()
//    {
//        // Arrange
//        var changeModel = new ChangePasswordModel
//        {
//            CurrentPassword = "OldPassword123",
//            NewPassword = "NewPassword123",
//            ConfirmPassword = "NewPassword123"
//        };

//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com"
//        };

//        // Setup controller to return authenticated user
//        var identity = new System.Security.Principal.GenericIdentity("test@example.com");
//        var principal = new System.Security.Principal.GenericPrincipal(identity, new[] { "User" });
//        _controller.ControllerContext = new ControllerContext
//        {
//            HttpContext = new DefaultHttpContext { User = principal }
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync("test@example.com"))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.ChangePasswordAsync(user, changeModel.CurrentPassword, changeModel.NewPassword))
//            .ReturnsAsync(IdentityResult.Success);

//        // Act
//        var result = await _controller.ChangePassword(changeModel);

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//        _mockUserManager.Verify(x => x.ChangePasswordAsync(user, changeModel.CurrentPassword, changeModel.NewPassword), Times.Once);
//    }

//    #endregion

//    #region Get Account Details Tests

//    [Fact]
//    public async Task GetAccountDetails_WithAuthenticatedUser_ReturnsUserData()
//    {
//        // Arrange
//        var user = new ApplicationUser
//        {
//            Id = "user-123",
//            Email = "test@example.com",
//            UserName = "testuser",
//            PhoneNumber = "+1234567890",
//            KycStatus = "verified",
//            CreatedAt = DateTime.UtcNow
//        };

//        var identity = new System.Security.Principal.GenericIdentity("test@example.com");
//        var principal = new System.Security.Principal.GenericPrincipal(identity, new[] { "User" });
//        _controller.ControllerContext = new ControllerContext
//        {
//            HttpContext = new DefaultHttpContext { User = principal }
//        };

//        _mockUserManager.Setup(x => x.FindByEmailAsync("test@example.com"))
//            .ReturnsAsync(user);

//        _mockUserManager.Setup(x => x.GetRolesAsync(user))
//            .ReturnsAsync(new List<string> { "Creator" });

//        // Act
//        var result = await _controller.GetAccountDetails();

//        // Assert
//        result.Should().BeOfType<OkObjectResult>();
//    }

//    #endregion
//}
