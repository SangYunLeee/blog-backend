import multer from "multer";
import fs from "fs";
import type { Request} from "express";

const getTempDir = () => {
  return `${__dirname}/../../uploads/temp`;
}

const getUploadRootDir = () => {
  return `${__dirname}/../../uploads`;
}

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const {fieldname, mimetype} = file;
  if (fieldname == 'thumnail' && !(mimetype.includes("image"))) {
    cb({message: '이미지 형식이 아닙니다.', status: 400, name: ''});
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, getTempDir());
  },
});

const upload = multer({ storage: storage, fileFilter });

const makeUploadFolder = () => {
  try {
    fs.readdirSync(getTempDir())
  } catch (e) {
    console.log("업로드 폴더를 생성합니다");
    fs.mkdirSync(getTempDir());
  }
}

export default {
  upload,
  getTempDir,
  getUploadRootDir,
  makeUploadFolder,
};
