import type {Progress,TurnFeedback,relationship} from './story';
export type SceneImage={src:string;alt:string;caption:string};
export type ConversationView={
 id:string;chapterId:string;displayName:string;index:number;total:number;audioUrl:string;completed:boolean;cue:string;suggestions:string[];
 messages:{index:number;audioUrl:string;image?:SceneImage}[];
 recordings:{audioUrl:string;duration:number}[];
 progress:Progress;relationship:ReturnType<typeof relationship>;feedback:TurnFeedback|null;
};
