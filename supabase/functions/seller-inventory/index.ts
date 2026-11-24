import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-inventory')+1);
 const [root,id,action]=[...['seller', 'inventory'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='inventory'){const businessId=uuid(body.business_id);await requireBusiness(req,businessId);const locationId=uuid(body.location_id);const variantId=uuid(body.variant_id);const loc=ok(await db.from('business_locations').select('business_id').eq('id',locationId).single()) as {business_id:string};const variant=ok(await db.from('product_variants').select('products(business_id)').eq('id',variantId).single()) as {products:{business_id:string}};if(loc.business_id!==businessId||variant.products.business_id!==businessId)throw new HttpError(403,'Resource ownership mismatch');if(req.method==='GET')return reply(cors,ok(await db.from('inventory').select('*').eq('location_id',locationId).eq('variant_id',variantId)));if(req.method==='POST'){const quantity=integer(body.on_hand,0,10000000);const existing=ok(await db.from('inventory').select('reserved,on_hand').eq('location_id',locationId).eq('variant_id',variantId).maybeSingle()) as {reserved:number,on_hand:number}|null;if(existing&&quantity<existing.reserved)throw new HttpError(409,'Cannot reduce below reserved');const result=ok(await db.from('inventory').upsert({location_id:locationId,variant_id:variantId,on_hand:quantity,reserved:existing?.reserved||0}).select().single());ok(await db.from('inventory_movements').insert({location_id:locationId,variant_id:variantId,delta:quantity-(existing?.on_hand||0),reason:'manual_adjustment'}));return reply(cors,result)}}
 throw new HttpError(404,'Route not found');
}));
