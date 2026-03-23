import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// Replicate the validation schemas used in Login and Signup pages
const emailSchema = z.string().trim().email("Please enter a valid email address");
const passwordSchema = z.string().min(1, "Password is required");

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

describe("Login validation", () => {
  it("accepts valid email", () => {
    expect(() => emailSchema.parse("user@example.com")).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => emailSchema.parse("not-an-email")).toThrow();
  });

  it("rejects empty password", () => {
    expect(() => passwordSchema.parse("")).toThrow();
  });

  it("accepts non-empty password", () => {
    expect(() => passwordSchema.parse("anypassword")).not.toThrow();
  });
});

describe("Signup validation", () => {
  const validData = {
    fullName: "Jane Smith",
    email: "jane@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts valid signup data", () => {
    expect(() => signupSchema.parse(validData)).not.toThrow();
  });

  it("rejects short full name", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = signupSchema.safeParse({ ...validData, password: "password1", confirmPassword: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signupSchema.safeParse({ ...validData, password: "PasswordOnly", confirmPassword: "PasswordOnly" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({ ...validData, confirmPassword: "WrongPassword1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.errors.find((e) => e.path.includes("confirmPassword"));
      expect(confirmError?.message).toBe("Passwords do not match");
    }
  });

  it("rejects invalid email in signup", () => {
    const result = signupSchema.safeParse({ ...validData, email: "bad-email" });
    expect(result.success).toBe(false);
  });
});
