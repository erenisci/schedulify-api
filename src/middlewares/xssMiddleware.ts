import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

const xssMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (let key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        const value = req.body[key];
        if (typeof value === 'string') {
          req.body[key] = xss(value);
        }
      }
    }
  }

  if (req.query) {
    for (let key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        const value = req.query[key];
        if (typeof value === 'string') {
          req.query[key] = xss(value);
        }
      }
    }
  }

  if (req.params) {
    for (let key in req.params) {
      if (req.params.hasOwnProperty(key)) {
        const value = req.params[key];
        if (typeof value === 'string') {
          req.params[key] = xss(value);
        }
      }
    }
  }

  next();
};

export default xssMiddleware;
