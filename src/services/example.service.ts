import exampleDao from "../models/example.dao";

const getExamples = async () => {
    return await exampleDao.getExamples({name: "LEE"});
}

export default {
  getExamples,
}
