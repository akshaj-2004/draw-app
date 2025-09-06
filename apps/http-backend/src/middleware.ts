import { JWT_SECRET } from "@repo/backend-common/config";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export function middleware(req: Request, res: Response, next: NextFunction){
    const token = req.headers["authorization"];
    if(!token){
        res.json({
            msg: "you are not authenticated"
        })
        return
    } else {
        const decoded = jwt.verify(token, JWT_SECRET);
        if(decoded){
            //@ts-ignore
            req.userId = (decoded as JwtPayload).id;
            next();
        }
    }
}