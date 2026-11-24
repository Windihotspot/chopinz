import {HttpError} from './https.ts';
import {getAdminClient} from './supabaseAdmin.ts';
export const uuid=(v:unknown)=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))throw new HttpError(400,'Valid UUID required');return v};
export const integer=(v:unknown,min=0,max=1e12)=>{if(!Number.isSafeInteger(v)||Number(v)<min||Number(v)>max)throw new HttpError(400,'Invalid integer');return Number(v)};
export const allowed=(obj:Record<string,unknown>,keys:string[])=>Object.fromEntries(Object.entries(obj).filter(([k])=>keys.includes(k)));
export const ok=(r:{data:unknown,error:unknown})=>{if(r.error)throw new HttpError(400,'Operation failed',(r.error as {message:string}).message);return r.data};
export const page=(req:Request)=>{const q=new URL(req.url).searchParams;const limit=Math.min(50,Math.max(1,Number(q.get('limit')||20)));const offset=Math.max(0,Math.min(10000,Number(q.get('offset')||0)));return {limit,offset}};
export const businessOf=async(db:ReturnType<typeof getAdminClient>,productId:string)=>{const p=ok(await db.from('products').select('business_id').eq('id',productId).single()) as {business_id:string};return p.business_id};
