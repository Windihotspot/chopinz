import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('reviews')+1);
 const [root,id,action]=[...['reviews'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='reviews'){if(req.method==='GET')return reply(cors,ok(await db.from('reviews').select('id,rating,comment,created_at').eq('status','approved').eq('product_id',uuid(q.get('product_id'))).range(pg.offset,pg.offset+pg.limit-1)));if(req.method==='POST'){const {user}=await requireUser(req);const orderItemId=uuid(body.order_item_id);const item=ok(await db.from('order_items').select('variant_id,seller_orders(order_id,orders(user_id,status))').eq('id',orderItemId).single()) as {variant_id:string;seller_orders:{orders:{user_id:string;status:string}}};if(item.seller_orders.orders.user_id!==user.id||!['completed','partially_completed'].includes(item.seller_orders.orders.status))throw new HttpError(403,'Verified completed purchase required');const variant=ok(await db.from('product_variants').select('product_id,products(business_id)').eq('id',item.variant_id).single()) as {product_id:string;products:{business_id:string}};return reply(cors,ok(await db.from('reviews').insert({user_id:user.id,order_item_id:orderItemId,product_id:variant.product_id,business_id:variant.products.business_id,rating:integer(body.rating,1,5),comment:text(body.comment,2000)}).select().single()),201)}}
 throw new HttpError(404,'Route not found');
}));
