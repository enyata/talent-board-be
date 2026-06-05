import AppDataSource from "@src/datasource";
import { NextFunction, Request, Response } from "express";
import { LocalAuthService } from "./local.service";
import type { LocalSignupRequest } from "./schemas/signup.schema";

export class LocalAuthController {
  constructor(private readonly service: LocalAuthService) {}

  /**
   * POST /auth/signup
   * Creates a local user account. OTP verification is implemented separately later.
   */
  async signupUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as LocalSignupRequest;

      const user = await this.service.signup(
        { email, password },
        AppDataSource.manager,
      );

      return res.status(201).json({
        message: "Signup successful.",
        data: {
          id: user.id,
          email: user.email,
          is_email_verified: user.is_email_verified,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
