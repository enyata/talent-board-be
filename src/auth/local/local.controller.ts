import AppDataSource from "@src/datasource";
import { ClientError } from "@src/exceptions/clientError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import log from "@src/utils/logger";
import { NextFunction, Request, Response } from "express";
import { LocalAuthService } from "./local.service";
import type { ForgotPasswordRequest } from "./schemas/forgotPassword.schema";
import type { LoginRequest } from "./schemas/login.schema";
import type { ResendOtpRequest } from "./schemas/resendOtp.schema";
import type { ResetPasswordRequest } from "./schemas/resetPassword.schema";
import type { LocalSignupRequest } from "./schemas/signup.schema";
import type { VerifyEmailRequest } from "./schemas/verifyEmail.schema";

const authService = new LocalAuthService();

export const signupUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as LocalSignupRequest;

    const user = await authService.signup(
      { email, password },
      AppDataSource.manager,
    );

    await authService
      .sendVerificationOtp(user, AppDataSource.manager)
      .catch((error) => {
        log.error(
          { err: error, email: user.email },
          "Failed to send verification OTP during signup",
        );
      });

    return res.status(201).json({
      message: "Signup successful.",
      data: {
        id: user.id,
        email: user.email,
        is_email_verified: user.is_email_verified,
      },
    });
  },
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body as VerifyEmailRequest;

    const user = await authService.verifyEmail(
      email,
      otp,
      AppDataSource.manager,
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await createSendToken(
      user,
      200,
      "Email verified Successfully",
      req,
      res,
      AppDataSource.manager,
    );
  },
);

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as LoginRequest;

    const user = await authService.login(
      { email, password },
      AppDataSource.manager,
    );

    await createSendToken(
      user,
      200,
      "Login successful",
      req,
      res,
      AppDataSource.manager,
    );
  },
);

export const resendOtp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as ResendOtpRequest;

    const successResponse = {
      status: "success",
      message:
        "If an account exists for this email, a new verification code has been sent.",
    };

    try {
      await authService.resendOtp(email, AppDataSource.manager);
    } catch (error) {
      // Handle specific cases where OTP cannot be resent, but treat them as "success" for user experience
      if (
        error instanceof NotFoundError ||
        (error instanceof ClientError && error.message.includes("social login"))
      ) {
        return res.status(200).json(successResponse);
      }
      log.error({ err: error, email }, "Unexpected error during OTP resend");
      throw error;
    }

    return res.status(200).json(successResponse);
  },
);

export const forgetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as ForgotPasswordRequest;

    const successResponse = {
      status: "success",
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };

    try {
      await authService.forgotPassword(email, AppDataSource.manager);
    } catch (error) {
      // Return a 200 success message even if the user is not found or is a social user
      // to prevent user enumeration attacks.
      if (
        error instanceof NotFoundError ||
        (error instanceof ClientError && error.message.includes("social login"))
      ) {
        return res.status(200).json(successResponse);
      }
      log.error(
        { err: error, email },
        "Unexpected error during forgot password request",
      );
      throw error;
    }

    return res.status(200).json(successResponse);
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, token, password } = req.body as ResetPasswordRequest;

    await authService.resetPassword(
      { email, token, password },
      AppDataSource.manager,
    );

    return res.status(200).json({
      status: "success",
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  },
);
