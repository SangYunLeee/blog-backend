import dao_set from "../models";
import { enumToArray } from "../utils/myutils";
import fileManger from "../middlewares/fileManager";
import { OpenRange } from "../types/post.types";

const { postDao, postTagDao, tagDao, cateDao, topicDao } = dao_set;

const createPosts = async (input: PostInputType) => {
  const {
    cateId,
    userId,
    tagNames,
    secretType,
    thumnail,
    topicId,
    title,
    content,
  } = input;

  // title 길이 검사
  if (title.length > 300) {
    throw { status: 400, message: "제목은 300자 이상 적을 수 없습니다." };
  }

  // title 길이 검사
  if (content.length > 1500) {
    throw { status: 400, message: "제목은 1500자 이상 적을 수 없습니다." };
  }

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

  const [topic] = await topicDao.getTopics({ topicId });
  if (!topic) {
    throw { status: 400, message: "해당하는 토픽이 존재하지 않습니다." };
  }

  const post = await postDao.createPosts(input);
  const postId = post.insertId;

  if (tagNames) {
    updateTagOnPost(postId, tagNames);
  }

  const thumbnailImgUrl = await fileManger.updateFile("post", postId, thumnail);
  if (thumbnailImgUrl) {
    await postDao.updatePosts({postId, thumbnailImgUrl});
  }
};

const getPosts = async (searchOption: PostSearchOption) => {
  const posts = await postDao.getPosts(searchOption);
  if (searchOption.postId) {
    return [posts, 1];
  }
  const maxCount = await postDao.getPosts({...searchOption, onlyCount: true});
  return [posts, maxCount];
}

const deletePosts = async (userId: string, postId: string) => {
  const [post] = await postDao.getPosts({userId, postId, loginedUserId: userId});
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
  if (secretType) {
    // 공개타입이 범위 내에 존재하는 지 확인
    const inRange = enumToArray(OpenRange).includes(Number(secretType));
    if (!inRange) {
      throw { status: 400, message: "secretType가 0~2 사이에 존재하지 않습니다. 0: 전체공개, 1: 맞팔공개, 2: 비공개" };
    }
  }

  const [post] = await postDao.getPosts({userId, postId, loginedUserId: userId});
  if (!post) {
    throw { status: 400, message: "본인이 작성한 포스트가 아니거나 포스트가 존재하지 않습니다." };
  }

  const thumbnailImgUrl = await fileManger.updateFile("post", postId, thumnail);
  await postDao.updatePosts({...input, thumbnailImgUrl});

  if (tagNames != undefined) {
    updateTagOnPost(post.id, tagNames);
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

export default {
  createPosts,
  getPosts,
  deletePosts,
  updatePosts,
};
