import {getRecord,putRecord} from '../server';
import {COURSE_ID} from './content';
import {emptyLearning,type LearningProgress} from './progress';
export const learningKey=(owner:string)=>owner+'/learning/'+COURSE_ID;
export async function readLearning(owner:string){return await getRecord<LearningProgress>(learningKey(owner))||emptyLearning();}
export async function saveLearning(owner:string,p:LearningProgress){await putRecord(learningKey(owner),p);}
