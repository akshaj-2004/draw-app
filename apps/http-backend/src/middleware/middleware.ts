import { JWT_SECRET } from "@repo/backend-common/config";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "@repo/types/express"



export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).json({ msg: "Authorization token missing" });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.id) {
      return res.status(401).json({ msg: "Invalid token" });
    }

    req.userId = decoded.id;
    next();
  } catch (e: any) {
    return res.status(401).json({ msg: "Unauthorized", error: e.message });
  }
}
