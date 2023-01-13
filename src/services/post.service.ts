import dao_set from "../models";
import { enumToArray } from "../utils/myutils";
import fileManger from "../middlewares/fileManager";
import { OpenRange } from "../types/post.types";
import fs from "fs";

const { postDao, postTagDao, tagDao, cateDao } = dao_set;

const createPosts = async (input: PostInputType) => {
  const { cateId, userId, tagNames, secretType, thumnail } = input;

  // 카테고리 정보 가져오기
  if (cateId) {
    const [cate] = await cateDao.getCategories({ userId, cateId });
    if (!cate) {
      throw { status: 400, message: "해당하는 카테고리가 존재하지 않습니다." };
    }
  }

  // 공개타입이 범위 내에 존재하는 지 확인
  const inRange = enumToArray(OpenRange).includes(Number(secretType));
  if (!inRange) {
    throw { status: 400, message: "secretType가 0~2 사이에 존재하지 않습니다. 0: 전체공개, 1: 맞팔공개, 2: 비공개" };
  }

  const post = await postDao.createPosts(input);
  const postId = post.insertId;

  if (tagNames) {
    updateTagOnPost(postId, tagNames);
  }

  if (thumnail) {
    updateFileOnPost(postId, thumnail);
  }
};

const getPosts = async (searchOption: PostSearchOption) => {
  return await postDao.getPosts(searchOption);
}

const deletePosts = async (userId: string, postId: string) => {
  const [post] = await postDao.getPosts({userId, postId});
  if (!post) {
    throw { status: 400, message: "본인이 작성한 포스트가 아니거나 포스트가 존재하지 않습니다." };
  }
  await postTagDao.deletePostTags(postId);
  await postDao.deletePosts(postId);
}

const updatePosts = async (input: PostInputType) => {
  const { userId, postId, tagNames, cateId, secretType, thumnail } = input;

  // 카테고리 정보 가져오기
  if (cateId) {
    const [cate] = await cateDao.getCategories({ userId, cateId });
    if (!cate) {
      throw { status: 400, message: "해당하는 카테고리가 존재하지 않습니다." };
    }
  }

  // 공개타입이 범위 내에 존재하는 지 확인
  const inRange = enumToArray(OpenRange).includes(Number(secretType));
  if (!inRange) {
    throw { status: 400, message: "secretType가 0~2 사이에 존재하지 않습니다. 0: 전체공개, 1: 맞팔공개, 2: 비공개" };
  }

  const [post] = await postDao.getPosts({userId, postId});
  if (!post) {
    throw { status: 400, message: "본인이 작성한 포스트가 아니거나 포스트가 존재하지 않습니다." };
  }

  await postDao.updatePosts(input);

  if (tagNames != undefined) {
    updateTagOnPost(post.id, tagNames);
  }

  if (thumnail) {
    updateFileOnPost(postId, thumnail);
  }
}

const updateTagOnPost = async (postId: string, tagNames: string[]) => {
  // 기존 태그 삭제
  await postTagDao.deletePostTags(postId);

  const trimedTagNames = tagNames
    .filter(v => v != "")
    .map(v =>(v.trim()));

  // 새로운 태그 생성 및 포스트와 태그 연결
  trimedTagNames.forEach(async (tagName) => {
    let [tag] = await tagDao.getTags(tagName);
    if (!tag) {
      tag = await tagDao.createTags(tagName);
    }
    tag.id = tag.id || tag.insertId;
    await postTagDao.createPostTags(postId, tag.id);
  })
}

const updateFileOnPost = async (postId: string, file: Express.Multer.File) => {
    const oldPath = file.path;
    const newPath = `${fileManger.getUploadRootDir()}/post/${postId}/`
    fs.mkdirSync(newPath, { recursive: true });
    fs.rename(oldPath, newPath + file.originalname, function (err) {
      if (err) throw err
      console.log('Successfully moved');
    })
    await postDao.updatePosts({postId, thumnailImgUrl: `/post/${postId}/${file.originalname}`});
}

export default {
  createPosts,
  getPosts,
  deletePosts,
  updatePosts,
};
