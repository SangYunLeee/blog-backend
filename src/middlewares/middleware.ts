import type express from "express";
import { app } from "../server";
import jwt from "jsonwebtoken";

const authMiddleware = async (...[req, _, next]: Parameters<express.RequestHandler>): Promise<any> => {
    authenticate(req, next);
};

const authInfoMiddleware = async (...[req, _, next]: Parameters<express.RequestHandler>): Promise<any> => {
    authenticate(req, next, false);
};

const adminMiddleware = async (...[req, _, next]: Parameters<express.RequestHandler>): Promise<any> => {
    const userInfo = req.userInfo;

    if (userInfo.email != "admin@gmail.com") {
        throw { status: 403, message: "접근 권한이 없습니다." };
    }
    next();
};

const urlMiddleware = async (...[req, _, next]: Parameters<express.RequestHandler>): Promise<any> => {
  app.locals.requestInfo = {
    hostInfo: `${req.protocol}://${req.get('host')}`
  }
  next();
};

const decodeToken = (token: string) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        console.log(`err: ${err}`);
        throw { status: 401, message: "unauthorized" };
    }
};

// error handling 미들웨어
const errorHandler: express.ErrorRequestHandler = (err: MyError, _1, res, _2) => {
    // 흐름상 에러가 검출되면 로그 표시 및 클라이언트에게 전달
    let responseInfo = err;
    if (err.sqlMessage) {
        console.log(err.sqlMessage);
        responseInfo = { ...err, status: 500, message: "failed" };
    }
    console.log("err LOG:", err);
    res.status(responseInfo.status || 500).send({ message: responseInfo.message || "" });
};

const authenticate = (req: express.Request, next: express.NextFunction, throwError: boolean = true) => {
  const token = req.headers.authorization;
  let decodedToken;
  try {
      decodedToken = decodeToken(token);
      req.userInfo = { id: decodedToken.id, email: decodedToken.email };
      console.log("userInfo: ", req.userInfo);
  } catch {
      if (throwError) {
        throw { status: 400, message: "토큰이 유효하지 않습니다." };
      }
  }
  next();
}

export default {
    authMiddleware,
    adminMiddleware,
    errorHandler,
    authInfoMiddleware,
    urlMiddleware,
};
