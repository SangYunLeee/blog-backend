import express from 'express';
import exampleSvc from '../services/example.service'

const getExamples = async (req: express.Request, res: express.Response) => {
  const examples = await exampleSvc.getExamples();
  res.status(200).json(examples);
}

export default {
  getExamples,
}
