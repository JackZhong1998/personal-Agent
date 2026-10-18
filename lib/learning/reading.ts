import {materialBlocks,sceneKey,type Scene} from './content';

// Some Chinese sentences translate two English sentences. Keep those pairs
// together instead of splitting the languages by character count.
const alignment:Record<string,number[]>={
 airport:[1,1,2,1,1,1],hotel:[1,1,1,1,1,2],subway:[1,1,1,2,1],
 museum:[1,1,2,1,1],rain:[1,1,2,1,1,1],dinner:[1,1,1,1,1,2],
 postcard:[1,1,1,1,2],departure:[1,1,1,1,1,2]
};
export function readingPages(scene:Scene){
 return materialBlocks(scene).flatMap(block=>{
  if(block.kind==='rosie')return [block];
  const en=block.en.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[block.en];
  const zh=block.zh.match(/[^。！？]+[。！？]+|[^。！？]+$/g)||[block.zh];
  let offset=0;
  const pairs=zh.map((text,i)=>{const count=alignment[sceneKey(scene)]?.[i]||1;const english=en.slice(offset,offset+count).join(' ').trim();offset+=count;return {kind:block.kind,en:english,zh:text};});
  const pages:typeof pairs=[];
  for(const pair of pairs){const last=pages.at(-1);if(last&&(last.en+' '+pair.en).split(/\s+/).length<=35&&(last.zh+pair.zh).length<=85){last.en+=' '+pair.en;last.zh+=pair.zh;}else pages.push({...pair});}
  return pages;
 });
}
