import express from 'express';
import service_set from "../services";
const { postSvc } = service_set;
import {checkDataIsNotEmpty,} from '../utils/myutils'

const createPosts = async (req: express.Request, res: express.Response) => {
  const { title, categoryId, content, secretType, topicId, tagNames} = req.body;
  checkDataIsNotEmpty({ title, content });
  const input = {
    title,
    userId: req.userInfo.id,
    cateId: categoryId || null,
    content,
    thumnail: req.file || null,
    secretType: secretType || 0,
    topicId: topicId || null,
    tagNames: tagNames? tagNames.split(',') : [tagNames],
  }

  await postSvc.createPosts(input);
  res.status(200).json({message: 'POST_CREATED'});
}

const getPosts = async (req: express.Request, res: express.Response) => {
  const { id: postId } = req.params;
  const posts = await postSvc.getPosts({postId});
  res.status(200).json(posts);
}

const deletePosts = async (req: express.Request, res: express.Response) => {
  const { id: postId } = req.params;
  await postSvc.deletePosts(req.userInfo.id, postId);
  res.status(200).json({message: 'POST_DELETED'});
}

const updatePosts = async (req: express.Request, res: express.Response) => {
  const { id: postId } = req.params;
  const { title, categoryId, content, secretType, topicId, tagNames} = req.body;
  checkDataIsNotEmpty({ title, content });
  const input = {
    postId,
    title,
    userId: req.userInfo.id,
    cateId: categoryId || null,
    content,
    thumnail: req.file || null,
    secretType: secretType || 0,
    topicId: topicId || null,
    tagNames: tagNames? tagNames.split(',') : [tagNames],
  }

  await postSvc.updatePosts(input);
  res.status(200).json({message: 'POST_UPDATED'});
}

export default {
  createPosts,
  getPosts,
  deletePosts,
  updatePosts,
}