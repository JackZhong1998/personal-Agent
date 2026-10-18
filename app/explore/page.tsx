import Link from 'next/link';
import Image from 'next/image';
import {characters} from '@/lib/characters';
import {StructurePage} from '@/components/StructurePage';
export default function Explore(){return <StructurePage title="探索"><div className="explore-grid">{characters.map(c=><Link href={c.available?'/':'/characters/'+c.id} className="explore-character" key={c.id}><div><Image src={c.image} alt="" fill sizes="(max-width:760px) 45vw, 250px"/></div><span>{c.name}</span>{!c.available&&<small>预览</small>}</Link>)}</div></StructurePage>;}
