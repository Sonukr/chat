import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { ApiError } from "../utils";
import { User } from "../database";

const jwtSecret = config.JWT_SECRET as string;

interface JwtPayload {
  id: string;
  name: string;
  email: string;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Support token from cookie or Authorization header
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "You are not logged in");
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
};
