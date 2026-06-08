import AppDataSource from "@src/datasource";
import { ClientError } from "@src/exceptions/clientError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import { NextFunction, Request, Response } from "express";
import { LocalAuthService } from "./local.service";
import type { ResendOtpRequest } from "./schemas/resendOtp.schema";
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
        console.error("Failed to send verification OTP", error);
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

export const resendOtp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as ResendOtpRequest;

    try {
      await authService.resendOtp(email, AppDataSource.manager);
    } catch (error) {
      // Handle specific cases where OTP cannot be resent, but treat them as "success" for user experience
      if (
        error instanceof NotFoundError ||
        (error instanceof ClientError && error.message.includes("social login"))
      ) {
        return res.status(200).json({
          status: "success",
          message:
            "If an account exists for this email, a new verification code has been sent.",
        });
      }
      console.error("Failed to resend verification OTP", error);
      throw error;
    }

    return res.status(200).json({
      status: "success",
      message:
        "If an account exists for this email, a new verification code has been sent.",
    });
  },
);
