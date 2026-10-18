import sources from '../public/rosie/sources.json';
export type RosiePhotoSource={url:string;source:string;artist:string;license:string;licenseUrl:string;title:string};
// Curated, downloaded CC BY 3.0 activity photos. Serve with the application so
// opening a page does not depend on Wikimedia availability or third-party calls.
export async function loadRosiePhotos():Promise<RosiePhotoSource[]>{return sources;}
