import dataSource from "./database";
import {
  getQueryOfSelectPost,
  getQueryOfOpenRange,
  getQueryOfMyFollow,
} from "./builder/post.sql";
import { whereBuilder, setBuilder } from "./builder/queryBuilder";
import {CreatePostDto, SearchPostDto, UpdatePostDto} from '../dtos/posts.dto';

const createPosts = async (postInput: CreatePostDto) => {
  const { title, userId, cateId, content, secretType, topicId } =
    postInput;
  const answer = await dataSource.query(
    `
    INSERT INTO
      posts(
        title,
        users_id,
        categories_id,
        content,
        secret_type,
        topics_id
      )
    VALUES
      (?,?,?,?,?,?)
    `,
    [
      title,
      userId,
      cateId,
      content,
      secretType,
      topicId,
    ]
  );
  return answer;
};

const getPosts = async (searchOption: SearchPostDto) => {
  const {
    postId,
    userId,
    cateId,
    topicId,
    search,
    countPerPage = 30,
    pageNumber = 1,
    loginedUserId,
    onlyCount = false,
  } = searchOption;
  let { myFollowing } = searchOption;
  if (myFollowing == "false") {
    myFollowing = undefined;
  }
  const answer = await dataSource
    .query(
      `
      ${getQueryOfSelectPost({ onlyCount })}
      ${whereBuilder("p.id",        ["="], postId, true)}
      ${whereBuilder("p.users_id",  ["="], userId)}
      ${whereBuilder("cate.id",     ["="], cateId)}
      ${whereBuilder("t.id",        ["="], topicId)}
      ${getQueryOfOpenRange(loginedUserId)}
      ${getQueryOfMyFollow(myFollowing)}
      ${whereBuilder("p.title",             ["LIKE", "AND", "SEARCH"], search)}
      ${whereBuilder("p.content",           ["LIKE", "OR",  "SEARCH"], search)}
      ${whereBuilder("cate.category_name",  ["LIKE", "OR",  "SEARCH"], search)}
      ${whereBuilder("tagsOnPost.tags",     ["LIKE", "OR",  "SEARCH"], search)}
      ${
        onlyCount == false?
          `LIMIT ${countPerPage} OFFSET ${countPerPage * (pageNumber - 1)}`
        :
          ``
      }
    `,
      [loginedUserId, loginedUserId, loginedUserId]
    )
    .then((answer) => {
      return [...answer].map((item) => {
        if (onlyCount) {
          return JSON.parse(item.maxCount);
        }
        return {
          ...item,
          category: JSON.parse(item.category),
          user: JSON.parse(item.user),
          topic: JSON.parse(item.topic),
          tags: JSON.parse(item.tags),
        }
    })
  });
  if (onlyCount) {
    return answer[0];
  }
  return answer;
};

const getMaxCountOfPosts = (searchOption: SearchPostDto) => {
  getPosts({ ...searchOption, onlyCount: true });
}

const deletePosts = async (postId: number) => {
  await dataSource.query(`
  DELETE FROM
    posts
  WHERE
    id = ?
  `, [postId]
  );
}

const updatePosts = async (postInput: UpdatePostDto) => {
  const propertyArray : [string, string | number, boolean?][] = [
    ['title',             postInput.title],
    ['categories_id',     postInput.cateId, true],
    ['content',           postInput.content],
    ['thumnail_img_url',  postInput.thumbnailImgUrl, true],
    ['secret_type',       postInput.secretType],
    ['topics_id',         postInput.topicId, true],
  ];
  const [stateOfSet, filterdValueArr] = setBuilder(propertyArray);
  const answer = await dataSource.query(
    `
      UPDATE
        posts
      SET
        ${stateOfSet}
      WHERE
        id = ?
      `,
    [...filterdValueArr, postInput.postId]
  );
  return answer;
};

export default {
  createPosts,
  getPosts,
  deletePosts,
  updatePosts,
  getMaxCountOfPosts,
};
