import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('products')+1);
 const [root,id,action]=[...['products'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='products'&&req.method==='GET'){const approved=ok(await db.from('businesses').select('id').eq('verification_status','approved')) as {id:string}[];if(!approved.length)return reply(cors,id?null:[]);let query=db.from('products').select('id,business_id,name,slug,description,category_id,unit,attributes,product_variants(id,price_kobo,options,active),product_images(storage_path)').eq('status','active').in('business_id',approved.map(x=>x.id));if(q.get('business_id'))query=query.eq('business_id',uuid(q.get('business_id')));if(q.get('category_id'))query=query.eq('category_id',uuid(q.get('category_id')));if(q.get('search'))query=query.ilike('name',`%${text(q.get('search'),80).replace(/[%_,]/g,'')}%`);return reply(cors,ok(id?await query.eq('id',uuid(id)).maybeSingle():await query.range(pg.offset,pg.offset+pg.limit-1)))}
 throw new HttpError(404,'Route not found');
}));
