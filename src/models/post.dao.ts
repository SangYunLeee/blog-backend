import dataSource from "./database";
import { whereBuilder, setBuilder } from "./builder/queryBuilder";

const createPosts = async (postInput: PostInputType) => {
  const { title, userId, cateId, content, thumnailImgUrl, secretType, topicId } =
    postInput;
  const answer = await dataSource.query(
    `
    INSERT INTO
      posts(
        title,
        users_id,
        categories_id,
        content,
        thumnail_img_url,
        secret_type,
        topics_id
      )
    VALUES
      (?,?,?,?,?,?,?)
    `,
    [
      title,
      userId,
      cateId,
      content,
      thumnailImgUrl,
      secretType,
      topicId
    ]
  );
  return answer;
};

const getPosts = async (searchOption: PostSearchOption) => {
  const { postId, userId } = searchOption;
  const answer = await dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        p.content,
        p.thumnail_img_url,
        p.secret_type,
        p.created_at,
        JSON_OBJECT(
          'id',
          cate.id,
          'categoryName',
          cate.category_name
        ) AS category,
        JSON_OBJECT(
          'id',
          u.id,
          'nickname',
          u.nickname
        ) AS user,
        JSON_OBJECT(
          'id',
          t.id,
          'topicName',
          t.topic_name
        ) AS topic,
        tagsOnPost.tags
      FROM
        posts AS p
        JOIN users AS u
          ON u.id = p.users_id
        LEFT JOIN categories AS cate
          ON cate.id = p.categories_id
        LEFT JOIN topics AS t
          ON t.id = p.topics_id
        LEFT JOIN ( -- select list of tag on post
          SELECT
            posts_id,
            JSON_ARRAYAGG(JSON_OBJECT("id", tags_id, "tagName", tag_name)) AS tags
          FROM
            posts_tags pt
            JOIN tags t ON t.id = pt.tags_id
          GROUP BY
            posts_id
        ) tagsOnPost
          ON tagsOnPost.posts_id = p.id
      ${whereBuilder("p.id", postId, true)}
      ${whereBuilder("p.users_id", userId)}
    `,
  ).then((answer) => {
    return [...answer].map((item)=> {
      return {...item,
          category: JSON.parse(item.category),
          user: JSON.parse(item.user),
          topic: JSON.parse(item.topic),
          tags: JSON.parse(item.tags),
        }
    })
  });

  return answer;
};

const deletePosts = async (postId: string) => {
  await dataSource.query(`
  DELETE FROM
    posts
  WHERE
    id = ?
  `, [postId]
  );
}

const updatePosts = async (postInput: PostInputType) => {
  const propertyArray : [string, string, boolean?][] = [
    ['title',             postInput.title],
    ['categories_id',     postInput.cateId],
    ['content',           postInput.content],
    ['thumnail_img_url',  postInput.thumnailImgUrl],
    ['secret_type',       postInput.secretType],
    ['topics_id',         postInput.topicId],
  ];
  const [stateOfSet, filterdValueArr] = setBuilder(propertyArray);
  const answer = await dataSource.query(
    `
      UPDATE
        posts
      SET
        ${stateOfSet}
      WHERE users_id = ?
      `,
    [...filterdValueArr, postInput.userId]
  );
  return answer;
};

export default {
  createPosts,
  getPosts,
  deletePosts,
  updatePosts,
};