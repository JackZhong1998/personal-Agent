import Link from 'next/link';
import {ArrowLeft} from 'lucide-react';
export function StructurePage({title,preview=false,children}:{title:string;preview?:boolean;children:React.ReactNode}){
 return <div className="structure-page"><header className="structure-header"><Link className="icon-button" href="/" aria-label="返回对话"><ArrowLeft size={20}/></Link><h1>{title}</h1>{preview&&<span className="preview-badge">预览</span>}</header><main className="structure-content">{children}</main></div>;
}
