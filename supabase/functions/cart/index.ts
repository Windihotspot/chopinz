import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('cart')+1);
 const [root,id,action]=[...['cart'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='cart'){const {user}=await requireUser(req);let cart=ok(await db.from('carts').select('id').eq('user_id',user.id).maybeSingle()) as {id:string}|null;if(!cart){cart=ok(await db.from('carts').insert({user_id:user.id}).select('id').single()) as {id:string}}if(req.method==='GET')return reply(cors,ok(await db.from('cart_items').select('*,product_variants(price_kobo,options,products(name,business_id))').eq('cart_id',cart.id)));if(req.method==='POST'&&id==='items'){const quantity=integer(body.quantity,1,1000);return reply(cors,ok(await db.from('cart_items').upsert({cart_id:cart.id,variant_id:uuid(body.variant_id),location_id:uuid(body.location_id),quantity},{onConflict:'cart_id,variant_id,location_id'}).select().single()),201)}if(req.method==='DELETE'&&id==='items'&&action)return reply(cors,ok(await db.from('cart_items').delete().eq('id',uuid(action)).eq('cart_id',cart.id).select()));}
 throw new HttpError(404,'Route not found');
}));
