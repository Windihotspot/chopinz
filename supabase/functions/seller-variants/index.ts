import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-variants')+1);
 const [root,id,action]=[...['seller', 'variants'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='variants'){const productId=uuid(body.product_id);await requireBusiness(req,await businessOf(db,productId));if(req.method==='POST')return reply(cors,ok(await db.from('product_variants').insert({...allowed(body,['sku','options','minimum_quantity','maximum_quantity','active']),product_id:productId,price_kobo:integer(body.price_kobo)}).select().single()),201)}
 throw new HttpError(404,'Route not found');
}));
