import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-businesses')+1);
 const [root,id,action]=[...['seller', 'businesses'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='businesses'){const {user}=await requireUser(req);if(req.method==='GET'){const memberships=ok(await db.from('business_members').select('business_id,role,businesses(*)').eq('user_id',user.id));return reply(cors,memberships)}if(req.method==='POST'){const name=text(body.name,120),slug=text(body.slug,120).toLowerCase();if(!name||!/^[a-z0-9-]{3,120}$/.test(slug))throw new HttpError(400,'Invalid name or slug');const created=ok(await db.from('businesses').insert({name,slug,owner_id:user.id,category_id:body.category_id||null,description:text(body.description),phone:text(body.phone,30)}).select().single()) as {id:string};ok(await db.from('business_members').insert({business_id:created.id,user_id:user.id,role:'owner'}));return reply(cors,created,201)}}
 throw new HttpError(404,'Route not found');
}));
