import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Signup from "@/app/(auth)/signup/page";
import * as apiAuth from "@/lib/api-auth";
import { SIGNUP_ROLE_STORAGE_KEY } from "@/lib/signup-role";

const push = vi.fn();
const replace = vi.fn();
let authState: any = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/signup",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    registerApi: vi.fn(),
  };
});

describe("Signup Password Policy Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, "creator");
    authState = {
      user: null,
      isLoading: false,
      isBackendVerified: false,
      establishSession: vi.fn().mockImplementation(async ({ token, user }) => {
        authState.user = user;
        authState.token = token;
        return user;
      }),
      login: vi.fn(),
      logout: vi.fn(),
    };
  });

  it("Test 1: missing uppercase -> frontend blocks submit + displays correct message", async () => {
    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "test@example.com" } });
    // Missing uppercase letter: "password123"
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Sign Up/i });
    fireEvent.click(submitBtn);

    // registerApi must NOT have been called (blocked by pre-submit validation)
    expect(apiAuth.registerApi).not.toHaveBeenCalled();

    // Frontend displays the correct error message
    const errorElements = await screen.findAllByText("Password must contain an uppercase letter.");
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("password-errors")).toHaveTextContent("Password must contain an uppercase letter.");
  });

  it("Test 2: valid password -> registration succeeds", async () => {
    const mockAuthResponse = {
      data: {
        token: "jwt-token-xyz",
        user: {
          id: "creator-user-valid",
          name: "Test User",
          email: "valid@example.com",
          roles: ["Creator"],
          user: "Creator",
        },
      },
    };
    vi.mocked(apiAuth.registerApi).mockResolvedValueOnce(mockAuthResponse as any);

    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "valid@example.com" } });
    // Valid password meeting all rules: min 6, uppercase, lowercase, number
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "ValidPass1" } });

    const submitBtn = screen.getByRole("button", { name: /Sign Up/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiAuth.registerApi).toHaveBeenCalledTimes(1);
      expect(apiAuth.registerApi).toHaveBeenCalledWith({
        fullName: "Test User",
        email: "valid@example.com",
        password: "ValidPass1",
        role: "Creator",
      });
      expect(authState.establishSession).toHaveBeenCalledWith({
        token: "jwt-token-xyz",
        user: mockAuthResponse.data.user,
      });
      expect(replace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("Test 3: backend validation response still displays correctly if frontend misses anything", async () => {
    // Simulate a scenario where backend rejects the password and returns data.Password[]
    const backendError = {
      response: {
        data: {
          success: false,
          message: "Validation failed.",
          data: {
            Password: [
              "Password must contain an uppercase letter.",
              "Password must contain a special character.",
            ],
          },
        },
      },
    };
    vi.mocked(apiAuth.registerApi).mockRejectedValueOnce(backendError);

    render(<Signup />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: "test@example.com" } });
    // Provide a password that passes frontend checks
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "ValidPass1" } });

    const submitBtn = screen.getByRole("button", { name: /Sign Up/i });
    fireEvent.click(submitBtn);

    // Backend error mapping into field UI
    await waitFor(() => {
      expect(screen.getByText("Validation failed.")).toBeInTheDocument();
      expect(screen.getByText(/Password must contain a special character/i)).toBeInTheDocument();
    });
  });
});
