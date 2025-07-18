import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../database";
import { ApiError, encryptPassword, isPasswordMatch } from "../utils";
import config from "../config/config";
import { IUser } from "../database";

const jwtSecret = config.JWT_SECRET as string;
const COOKIE_EXPIRATION_DAYS = 1; // cookie expiration in days
const expirationDate = new Date(
    Date.now() + COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
);
const cookieOptions = {
    expires: expirationDate,
    secure: false,
    httpOnly: true,
};

const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, "User already exists!");
        }

        const user = await User.create({
            name,
            email,
            password: await encryptPassword(password),
        });

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
        };

        return res.json({
            status: 200,
            message: "User registered successfully!",
            data: userData,
        });
    } catch (error: any) {
        return res.json({
            status: 500,
            message: error.message,
        });
    }
};

const createSendToken = async (user: IUser, res: Response) => {
    const { name, email, id } = user;
    const token = jwt.sign({ name, email, id }, jwtSecret, {
        expiresIn: "1d",
    });
    if (config.env === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

    return token;
};

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (
            !user ||
            !(await isPasswordMatch(password, user.password as string))
        ) {
            throw new ApiError(400, "Incorrect email or password");
        }

        const token = await createSendToken(user!, res);

        return res.json({
            status: 200,
            message: "User logged in successfully!",
            user: {id: user._id, name: user.name, email: user.email},
            token,
        });
    } catch (error: any) {
        return res.json({
            status: 500,
            message: error.message,
        });
    }
};


const me = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized",
            });
        }

        const { _id, name, email } = req.user;

        return res.json({
            status: 200,
            message: "User fetched successfully!",
            user: {
                id: _id,
                name,
                email,
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};


const logout = async (req: Request, res: Response) => {};

const getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await User.find().select("-password");
      return res.json({
        status: 200,
        message: "Users fetched successfully",
        users,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  };
  


export default {
    register,
    login,
    me,
    getAllUsers
};