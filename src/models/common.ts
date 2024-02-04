import { app } from "../server";
const NODE_ENV = process.env.NODE_ENV;
const appendPath = NODE_ENV? `${NODE_ENV}`: '.';

const getDomain = function () {
  const url = app?.locals?.requestInfo?.hostInfo;

  return url || `http://localhost:${process.env.PORT || 5500}/${appendPath}`;;
}

export {
  getDomain,
};
