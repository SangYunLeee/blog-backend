import dataSource from "./database";
import {getDomain} from "./common";

const defaultUserImgUrl = '/user/default-img.png';

// 팔로우 하기
const createFollow = async (userId: string, targetUsersId: string) => {
    await dataSource.query(
        `
          INSERT INTO
            follow
            (users_id, target_users_id)
          VALUES
            (?, ?);
        `,
        [userId, targetUsersId]
    );
};

// 팔로우 존재 여부
const existFollow = async (userId: string, targetUsersId: string) => {
    const [list] = await dataSource.query(
        `
        SELECT
          id,
          target_users_id
        FROM
          follow
        WHERE
          users_id = ?
        AND
          target_users_id = ?
      `,
        [userId, targetUsersId]
    );
    return list;
};

// 언팔로우 하기
const deleteFollow = async (userId: string, targetUsersId: string) => {
    await dataSource.query(
        `
          DELETE FROM
            follow
          WHERE
            users_id = ?
          AND
            target_users_id = ?
        `,
        [userId, targetUsersId]
    );
};

// 팔로잉 리스트 보기
const getFollowings = async (targetUserId: string, userId: string) => {
    const array = userId? [userId, targetUserId] : [targetUserId];
    const list = await dataSource.query(
        `
        SELECT
          follow.target_users_id AS id,
          users.nickname,
          users.email,
          CONCAT('${getDomain()}',IFNULL(users.profile_img_url, '${defaultUserImgUrl}')) AS profileImgUrl
          ${userId?`, IF(ISNULL(myFollow.users_id), 'false', 'true') AS registed` : ''}
        FROM
          follow
          JOIN users ON users.id = follow.target_users_id
          ${userId? `LEFT JOIN (
            SELECT
              follow.target_users_id AS users_id
            FROM
              follow
            WHERE
              follow.users_id = ?
          ) AS myFollow ON follow.target_users_id = myFollow.users_id` : ''}
        WHERE
          follow.users_id = ?
        `,
        array
    ).then(answer => {
      return answer;
    });
    return list;
};

// 팔로워 리스트 보기
const getFollowers = async (targetUserId: string, userId: string) => {
  const array = userId? [userId, targetUserId] : [targetUserId];
    const list = await dataSource.query(
        `
        SELECT
            follow.users_id AS id,
            users.nickname,
            users.email,
            CONCAT('${getDomain()}',IFNULL(users.profile_img_url, '${defaultUserImgUrl}')) AS profileImgUrl
            ${userId?`, IF(ISNULL(myFollow.users_id), 'false', 'true') AS registed` : ''}
        FROM
          follow
        JOIN users ON users.id = follow.users_id
        ${userId? `LEFT JOIN (
          SELECT
            follow.target_users_id AS users_id
          FROM
            follow
          WHERE
            follow.users_id = ?
        ) AS myFollow ON follow.users_id = myFollow.users_id` : ''}
        WHERE
            target_users_id = ?
        `,
        array
        ).then(answer => {
          return [...answer].map((item)=> {
            return userId? {...item, registed: JSON.parse(item.registed)} : item
          })
        });
    return list;
};

export default {
    createFollow,
    existFollow,
    deleteFollow,
    getFollowings,
    getFollowers,
};
