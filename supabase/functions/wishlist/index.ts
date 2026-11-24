import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('wishlist')+1);
 const [root,id,action]=[...['wishlist'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='wishlist'){const {user}=await requireUser(req);if(req.method==='GET')return reply(cors,ok(await db.from('wishlists').select('product_id').eq('user_id',user.id)));if(req.method==='POST')return reply(cors,ok(await db.from('wishlists').upsert({user_id:user.id,product_id:uuid(body.product_id)}).select()));if(req.method==='DELETE'&&id)return reply(cors,ok(await db.from('wishlists').delete().eq('user_id',user.id).eq('product_id',uuid(id)).select()));}
 throw new HttpError(404,'Route not found');
}));
