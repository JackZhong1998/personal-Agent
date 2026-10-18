import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {characters,characterSources} from '@/lib/characters';
import {StructurePage} from '@/components/StructurePage';
export function generateStaticParams(){return characters.filter(c=>!c.available).map(c=>({id:c.id}));}
export const dynamicParams=false;
export default async function Character({params}:{params:Promise<{id:string}>}){
 const {id}=await params,c=characters.find(c=>c.id===id&&!c.available);if(!c)notFound();const source=characterSources.find(s=>s.id===id);
 return <StructurePage title={c.name} preview><div className="character-preview"><div className="character-preview-photo"><Image src={c.image} alt={c.name} fill sizes="(max-width:760px) 80vw, 340px" priority/></div><span className="character-preview-status">尚未开放</span><Link className="primary-button full" href="/">返回首页</Link>{source&&<details className="character-source"><summary>照片来源</summary><p><a href={source.source} target="_blank" rel="noreferrer">{source.artist}</a> · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></p></details>}</div></StructurePage>;
}
