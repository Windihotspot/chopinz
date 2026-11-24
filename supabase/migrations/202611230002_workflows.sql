-- Atomic checkout, inventory reservation, settlement and expiry. RPC execution is service-role only.
create or replace function public.checkout_create(p_user uuid,p_key text,p_lines jsonb,p_fulfillment jsonb)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare v_order uuid;v_ref text;v_line jsonb;v_group record;v_variant record;v_qty int;v_price bigint;v_sub bigint:=0;v_total bigint;v_seller uuid;v_commission bigint;v_delivery bigint;v_address jsonb;v_method text;v_quote uuid;v_discount bigint:=0;v_groups jsonb:='{}'::jsonb;v_group_key text;v_detail jsonb;v_business uuid;v_location uuid;v_existing uuid;
begin
 if p_user is null or length(p_key)<8 or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>100 then raise exception 'Invalid checkout request';end if;
 select id into v_existing from public.orders where user_id=p_user and idempotency_key=p_key;
 if v_existing is not null then return jsonb_build_object('order_id',v_existing,'reused',true);end if;
 -- Lock variants/inventory in deterministic order to reduce deadlocks.
 for v_line in select value from jsonb_array_elements(p_lines) order by value->>'location_id',value->>'variant_id' loop
   v_qty:=(v_line->>'quantity')::int;
   if v_qty<1 or v_qty>1000 then raise exception 'Invalid quantity';end if;
   select v.id,v.price_kobo,v.minimum_quantity,v.maximum_quantity,v.active,p.name,p.status,p.business_id,l.business_id as location_business,b.verification_status,b.commission_bps
   into v_variant from public.product_variants v join public.products p on p.id=v.product_id join public.business_locations l on l.id=(v_line->>'location_id')::uuid join public.businesses b on b.id=p.business_id where v.id=(v_line->>'variant_id')::uuid;
   if not found or not v_variant.active or v_variant.status<>'active' or v_variant.verification_status<>'approved' or v_variant.business_id<>v_variant.location_business or v_qty<v_variant.minimum_quantity or (v_variant.maximum_quantity is not null and v_qty>v_variant.maximum_quantity) then raise exception 'Product unavailable';end if;
   update public.inventory set reserved=reserved+v_qty where location_id=(v_line->>'location_id')::uuid and variant_id=(v_line->>'variant_id')::uuid and on_hand-reserved>=v_qty;
   if not found then raise exception 'Insufficient inventory';end if;
   select coalesce((select pt.unit_price_kobo from public.price_tiers pt where pt.variant_id=v_variant.id and pt.min_quantity<=v_qty order by pt.min_quantity desc limit 1),v_variant.price_kobo) into v_price;
   v_group_key:=v_line->>'location_id';v_detail:=coalesce(v_groups->v_group_key,jsonb_build_object('business_id',v_variant.business_id,'subtotal',0,'items','[]'::jsonb));
   v_detail:=jsonb_set(v_detail,'{subtotal}',to_jsonb((v_detail->>'subtotal')::bigint+v_price*v_qty));
   v_detail:=jsonb_set(v_detail,'{items}',(v_detail->'items')||jsonb_build_array(jsonb_build_object('variant_id',v_variant.id,'product_name',v_variant.name,'quantity',v_qty,'unit_price',v_price,'options',coalesce(v_line->'options','{}'::jsonb))));
   v_groups:=jsonb_set(v_groups,array[v_group_key],v_detail);v_sub:=v_sub+v_price*v_qty;
 end loop;
 v_ref:='CHP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,14));
 insert into public.orders(user_id,reference,subtotal_kobo,total_kobo,idempotency_key) values(p_user,v_ref,v_sub,v_sub,p_key) returning id into v_order;
 for v_group in select key,value from jsonb_each(v_groups) loop
   v_location:=v_group.key::uuid;v_business:=(v_group.value->>'business_id')::uuid;
   v_method:=coalesce(p_fulfillment->v_group.key->>'method','pickup');
   if v_method not in ('pickup','delivery') then raise exception 'Invalid fulfillment method';end if;
   if v_method='pickup' and not exists(select 1 from public.business_locations where id=v_location and pickup_enabled) then raise exception 'Pickup unavailable';end if;
   if v_method='delivery' then
     if not exists(select 1 from public.business_locations where id=v_location and delivery_enabled) then raise exception 'Delivery unavailable';end if;
     v_quote:=(p_fulfillment->v_group.key->>'quote_id')::uuid;
     select q.amount_kobo into v_delivery from public.delivery_quotes q where q.id=v_quote and q.location_id=v_location and q.customer_id=p_user and q.expires_at>now();
     if not found then raise exception 'Valid delivery quote required';end if;
     select to_jsonb(a) into v_address from public.customer_addresses a join public.delivery_quotes q on q.address_id=a.id where q.id=v_quote and a.user_id=p_user;
     if v_address is null then raise exception 'Delivery address required';end if;
   else v_delivery:=0;v_address:=null;end if;
   select round((v_group.value->>'subtotal')::bigint*b.commission_bps/10000.0)::bigint into v_commission from public.businesses b where b.id=v_business;
   insert into public.seller_orders(order_id,business_id,location_id,fulfillment_method,address_snapshot,subtotal_kobo,delivery_kobo,commission_kobo)
   values(v_order,v_business,v_location,v_method,v_address,(v_group.value->>'subtotal')::bigint,v_delivery,v_commission) returning id into v_seller;
   insert into public.order_items(seller_order_id,variant_id,product_name,variant_options,quantity,unit_price_kobo,line_total_kobo)
   select v_seller,(x->>'variant_id')::uuid,x->>'product_name',coalesce(x->'options','{}'::jsonb),(x->>'quantity')::int,(x->>'unit_price')::bigint,(x->>'quantity')::int*(x->>'unit_price')::bigint from jsonb_array_elements(v_group.value->'items') x;
   insert into public.commissions(seller_order_id,amount_kobo,rate_bps) select v_seller,v_commission,commission_bps from public.businesses where id=v_business;
   update public.orders set delivery_kobo=delivery_kobo+v_delivery,total_kobo=total_kobo+v_delivery where id=v_order;
 end loop;
 return jsonb_build_object('order_id',v_order,'reference',v_ref,'total_kobo',(select total_kobo from public.orders where id=v_order),'reused',false);
end $$;
create or replace function public.payment_confirm(p_provider text,p_reference text,p_amount bigint,p_currency text,p_event_id text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare v_payment record;v_order record;v_so record;v_item record;
begin
 select p.* into v_payment from public.payments p join public.payment_transactions t on t.payment_id=p.id where t.provider=p_provider and t.provider_reference=p_reference for update of p;
 if not found then raise exception 'Unknown payment reference';end if;
 select * into v_order from public.orders where id=v_payment.order_id for update;
 if v_payment.amount_kobo<>p_amount or v_order.total_kobo<>p_amount or p_currency<>'NGN' or v_payment.currency<>p_currency then raise exception 'Payment amount/currency mismatch';end if;
 if v_payment.status='success' then return jsonb_build_object('already_processed',true,'order_id',v_order.id);end if;
 if v_order.status<>'pending_payment' or v_order.expires_at<=now() then raise exception 'Order expired or not payable';end if;
 update public.payments set status='success' where id=v_payment.id;
 update public.payment_transactions set status='success',raw=p_payload where provider=p_provider and provider_reference=p_reference;
 update public.orders set status='paid' where id=v_order.id;
 for v_so in select * from public.seller_orders where order_id=v_order.id loop
   for v_item in select * from public.order_items where seller_order_id=v_so.id loop
     update public.inventory set reserved=reserved-v_item.quantity,on_hand=on_hand-v_item.quantity where location_id=v_so.location_id and variant_id=v_item.variant_id and reserved>=v_item.quantity;
     if not found then raise exception 'Inventory reservation missing';end if;
     insert into public.inventory_movements(location_id,variant_id,delta,reason,reference_id) values(v_so.location_id,v_item.variant_id,-v_item.quantity,'sale',v_so.id);
   end loop;
   insert into public.seller_ledger(business_id,seller_order_id,kind,amount_kobo,reference) values(v_so.business_id,v_so.id,'sale',v_so.subtotal_kobo,'sale:'||v_so.id) on conflict do nothing;
   insert into public.seller_ledger(business_id,seller_order_id,kind,amount_kobo,reference) values(v_so.business_id,v_so.id,'commission',-v_so.commission_kobo,'commission:'||v_so.id) on conflict do nothing;
   insert into public.notifications(user_id,kind,title,body) select bm.user_id,'new_order','New paid order',v_order.reference from public.business_members bm where bm.business_id=v_so.business_id and bm.role in ('owner','manager');
 end loop;
 insert into public.notifications(user_id,kind,title,body) values(v_order.user_id,'payment_success','Payment received',v_order.reference);
 insert into public.notification_jobs(user_id,channel,template_key,subject,body,variables) values(v_order.user_id,'email','PLACED','Order confirmed','Your order '||v_order.reference||' is confirmed',jsonb_build_object('order_reference',v_order.reference)),(v_order.user_id,'sms',null,null,'Chopinz: payment confirmed for '||v_order.reference,'{}'::jsonb);
 return jsonb_build_object('already_processed',false,'order_id',v_order.id);
end $$;
create or replace function public.expire_orders() returns integer language plpgsql security definer set search_path=public,private as $$
declare r record;i record;n int:=0;
begin
 for r in select * from public.orders where status='pending_payment' and expires_at<now() for update skip locked loop
  for i in select so.location_id,oi.variant_id,oi.quantity from public.seller_orders so join public.order_items oi on oi.seller_order_id=so.id where so.order_id=r.id loop
   update public.inventory set reserved=reserved-i.quantity where location_id=i.location_id and variant_id=i.variant_id and reserved>=i.quantity;
  end loop;
  update public.orders set status='cancelled' where id=r.id;
  update public.seller_orders set status='cancelled' where order_id=r.id;
  n:=n+1;
 end loop;return n;
end $$;
-- Only the Edge Function service role may execute sensitive RPCs.
revoke all on function public.checkout_create(uuid,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.payment_confirm(text,text,bigint,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.expire_orders() from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function public.checkout_create(uuid,text,jsonb,jsonb) to service_role;
grant execute on function public.payment_confirm(text,text,bigint,text,text,jsonb) to service_role;
grant execute on function public.expire_orders() to service_role;
