drop trigger if exists "set_archived_at" on "public"."fish_data";

drop trigger if exists "update_fish_data_updated_at" on "public"."fish_data";

drop trigger if exists "sync_fish_price_trigger" on "public"."manual_prices";

drop trigger if exists "update_manual_prices_updated_at" on "public"."manual_prices";

drop trigger if exists "log_order_status_change" on "public"."orders";

drop trigger if exists "set_order_number_on_insert" on "public"."orders";

drop trigger if exists "update_orders_updated_at" on "public"."orders";

drop trigger if exists "validate_order_data_trigger" on "public"."orders";

drop policy "Admins can manage archived items" on "public"."fish_data";

drop policy "Admins can view all items" on "public"."fish_data";

drop policy "Enable admin access to fish_data" on "public"."fish_data";

drop policy "Enable admin price updates" on "public"."fish_data";

drop policy "Enable delete access for all users" on "public"."fish_data";

drop policy "Enable insert access for all users" on "public"."fish_data";

drop policy "Enable public read access to fish_data" on "public"."fish_data";

drop policy "Enable update access for all users" on "public"."fish_data";

drop policy "admin_update_fish_prices" on "public"."fish_data";

drop policy "public_view_fish_prices" on "public"."fish_data";

drop policy "Admins can view all order items" on "public"."order_items";

drop policy "admin_manage_order_items" on "public"."order_items";

drop policy "insert_order_items" on "public"."order_items";

drop policy "view_order_items" on "public"."order_items";

drop policy "Admin insert status updates" on "public"."order_status_history";

drop policy "Admins can insert status updates" on "public"."order_status_history";

drop policy "Users can view own order status history" on "public"."order_status_history";

drop policy "Admin update orders" on "public"."orders";

drop policy "Admin view all orders" on "public"."orders";

drop policy "Admins can update orders" on "public"."orders";

drop policy "Admins can view all orders" on "public"."orders";

drop policy "Allow guest order creation" on "public"."orders";

drop policy "Users can create own orders" on "public"."orders";

drop policy "Users can create their own orders" on "public"."orders";

drop policy "Users can view own orders" on "public"."orders";

drop policy "Users can view their own orders" on "public"."orders";

drop policy "Admins can manage shipping options" on "public"."shipping_options";

drop policy "Everyone can view active shipping options" on "public"."shipping_options";

alter table "public"."order_status_history" drop constraint "order_status_history_created_by_fkey";

alter table "public"."orders" drop constraint "orders_user_id_fkey";

alter table "public"."manual_prices" drop constraint "manual_prices_fish_id_fkey";

alter table "public"."order_items" drop constraint "order_items_order_id_fkey";

alter table "public"."order_status_history" drop constraint "order_status_history_order_id_fkey";

drop index if exists "public"."idx_fish_data_archived";

drop index if exists "public"."idx_fish_data_ebay_listing_id";

drop index if exists "public"."idx_fish_data_ebay_listing_status";

drop index if exists "public"."idx_fish_data_order";

drop index if exists "public"."idx_fish_data_original_cost";

drop index if exists "public"."idx_fish_data_qtyoh";

drop index if exists "public"."idx_fish_data_sale_cost";

drop index if exists "public"."idx_fish_images_non_null_images";

drop index if exists "public"."idx_fish_images_search_name_upper";

drop index if exists "public"."idx_order_items_fish_id";

create table "public"."categories" (
    "name" text not null,
    "id" bigint generated by default as identity not null,
    "total_items" smallint default '0'::smallint,
    "active" smallint default '0'::smallint,
    "disabled" smallint default '0'::smallint,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."email_queue" (
    "id" uuid not null default gen_random_uuid(),
    "to_address" text not null,
    "subject" text not null,
    "template" text not null,
    "template_data" jsonb not null default '{}'::jsonb,
    "status" text not null default 'pending'::text,
    "attempts" integer default 0,
    "last_attempt_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."fish_info" (
    "id" uuid not null default gen_random_uuid(),
    "search_name" text not null,
    "scientific_name" text,
    "family" text,
    "habitat" text,
    "distribution" text,
    "max_size" numeric,
    "common_size" numeric,
    "min_temp" numeric,
    "max_temp" numeric,
    "min_ph" numeric,
    "max_ph" numeric,
    "difficulty" text,
    "compatibility" text,
    "diet" text,
    "description" text,
    "reef_safe" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ebay_credentials" disable row level security;

alter table "public"."fish_data" drop column "archived";

alter table "public"."fish_data" drop column "archived_at";

alter table "public"."fish_data" drop column "disabled";

alter table "public"."fish_data" drop column "ebay_listing_id";

alter table "public"."fish_data" drop column "ebay_listing_status";

alter table "public"."fish_data" drop column "is_category";

alter table "public"."fish_data" drop column "order_index";

alter table "public"."fish_data" drop column "original_cost";

alter table "public"."fish_data" drop column "qtyoh";

alter table "public"."fish_data" drop column "size";

alter table "public"."fish_data" add column "scientific_name" text;

alter table "public"."fish_data" add column "stock" integer default 0;

alter table "public"."fish_data" alter column "cost" set data type numeric(10,2) using "cost"::numeric(10,2);

alter table "public"."fish_data" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."fish_data" alter column "sale_cost" set data type numeric(10,2) using "sale_cost"::numeric(10,2);

alter table "public"."fish_data" alter column "updated_at" set default CURRENT_TIMESTAMP;

alter table "public"."fish_data" enable row level security;

alter table "public"."manual_prices" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."manual_prices" alter column "fish_id" drop not null;

alter table "public"."manual_prices" alter column "price" set data type numeric(10,2) using "price"::numeric(10,2);

alter table "public"."manual_prices" alter column "updated_at" set default CURRENT_TIMESTAMP;

alter table "public"."manual_prices" enable row level security;

alter table "public"."order_items" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."order_items" alter column "name_at_time" drop default;

alter table "public"."order_items" alter column "order_id" drop not null;

alter table "public"."order_items" alter column "price_at_time" set data type numeric(10,2) using "price_at_time"::numeric(10,2);

alter table "public"."order_status_history" drop column "created_by";

alter table "public"."order_status_history" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."order_status_history" alter column "order_id" drop not null;

alter table "public"."orders" drop column "user_id";

alter table "public"."orders" add column "notes" text;

alter table "public"."orders" add column "stripe_payment_intent" text;

alter table "public"."orders" add column "stripe_payment_status" text;

alter table "public"."orders" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."orders" alter column "order_number" set not null;

alter table "public"."orders" alter column "total_amount" set data type numeric(10,2) using "total_amount"::numeric(10,2);

alter table "public"."orders" alter column "updated_at" set default CURRENT_TIMESTAMP;

alter table "public"."payment_methods" disable row level security;

alter table "public"."price_markups" disable row level security;

alter table "public"."shipping_addresses" add column "email" text;

alter table "public"."shipping_addresses" disable row level security;

alter table "public"."shipping_options" drop column "estimated_days";

alter table "public"."shipping_options" alter column "created_at" set default CURRENT_TIMESTAMP;

alter table "public"."shipping_options" alter column "price" set data type numeric(10,2) using "price"::numeric(10,2);

alter table "public"."shipping_options" alter column "updated_at" set default CURRENT_TIMESTAMP;

alter table "public"."user_profiles" disable row level security;

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (name);

CREATE UNIQUE INDEX email_queue_pkey ON public.email_queue USING btree (id);

CREATE UNIQUE INDEX fish_info_pkey ON public.fish_info USING btree (id);

CREATE INDEX idx_fish_data_category ON public.fish_data USING btree (category);

CREATE INDEX idx_fish_images_user_id ON public.fish_images USING btree (user_id);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history USING btree (order_id);

CREATE INDEX idx_orders_guest_email ON public.orders USING btree (guest_email);

CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);

CREATE INDEX idx_shipping_addresses_email ON public.shipping_addresses USING btree (email);

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."email_queue" add constraint "email_queue_pkey" PRIMARY KEY using index "email_queue_pkey";

alter table "public"."fish_info" add constraint "fish_info_pkey" PRIMARY KEY using index "fish_info_pkey";

alter table "public"."fish_info" add constraint "fish_info_reef_safe_check" CHECK ((reef_safe = ANY (ARRAY['Yes'::text, 'No'::text, 'With Caution'::text]))) not valid;

alter table "public"."fish_info" validate constraint "fish_info_reef_safe_check";

alter table "public"."manual_prices" add constraint "manual_prices_fish_id_fkey" FOREIGN KEY (fish_id) REFERENCES fish_data(id) ON DELETE CASCADE not valid;

alter table "public"."manual_prices" validate constraint "manual_prices_fish_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_status_history" add constraint "order_status_history_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_status_history" validate constraint "order_status_history_order_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.queue_order_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Queue confirmation email for the order
  INSERT INTO email_queue (
    to_address,
    subject,
    template,
    template_data
  )
  VALUES (
    COALESCE(
      (SELECT email FROM auth.users WHERE id = NEW.user_id),
      NEW.guest_email
    ),
    'Order Confirmation #' || NEW.order_number,
    'order_confirmation',
    jsonb_build_object(
      'order_number', NEW.order_number,
      'total_amount', NEW.total_amount,
      'shipping_address', NEW.shipping_address,
      'order_items', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', name_at_time,
          'quantity', quantity,
          'price', price_at_time
        ))
        FROM order_items
        WHERE order_id = NEW.id
      )
    )
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.queue_shipping_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only queue email if tracking info was added or updated
  IF (TG_OP = 'UPDATE') AND (
    NEW.tracking_number IS DISTINCT FROM OLD.tracking_number OR
    NEW.shipping_carrier IS DISTINCT FROM OLD.shipping_carrier OR
    NEW.tracking_url IS DISTINCT FROM OLD.tracking_url
  ) THEN
    INSERT INTO email_queue (
      to_address,
      subject,
      template,
      template_data
    )
    VALUES (
      COALESCE(
        (SELECT email FROM auth.users WHERE id = NEW.user_id),
        NEW.guest_email
      ),
      'Shipping Update for Order #' || NEW.order_number,
      'shipping_update',
      jsonb_build_object(
        'order_number', NEW.order_number,
        'tracking_number', NEW.tracking_number,
        'shipping_carrier', NEW.shipping_carrier,
        'tracking_url', NEW.tracking_url
      )
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_number text;
  attempts integer := 0;
BEGIN
  LOOP
    -- Generate order number: AK-YYYYMMDD-NNNN
    new_number := 'AK-' || 
                 to_char(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                 LPAD(floor(random() * 9999 + 1)::text, 4, '0');
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      RETURN new_number;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= 5 THEN
      -- If we've tried 5 times, use timestamp-based fallback
      RETURN 'AK-' || to_char(extract(epoch from now())::integer, 'FM99999999');
    END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS NULL) OR (NEW.status <> OLD.status) THEN
    INSERT INTO order_status_history (order_id, status, created_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."email_queue" to "anon";

grant insert on table "public"."email_queue" to "anon";

grant references on table "public"."email_queue" to "anon";

grant select on table "public"."email_queue" to "anon";

grant trigger on table "public"."email_queue" to "anon";

grant truncate on table "public"."email_queue" to "anon";

grant update on table "public"."email_queue" to "anon";

grant delete on table "public"."email_queue" to "authenticated";

grant insert on table "public"."email_queue" to "authenticated";

grant references on table "public"."email_queue" to "authenticated";

grant select on table "public"."email_queue" to "authenticated";

grant trigger on table "public"."email_queue" to "authenticated";

grant truncate on table "public"."email_queue" to "authenticated";

grant update on table "public"."email_queue" to "authenticated";

grant delete on table "public"."email_queue" to "service_role";

grant insert on table "public"."email_queue" to "service_role";

grant references on table "public"."email_queue" to "service_role";

grant select on table "public"."email_queue" to "service_role";

grant trigger on table "public"."email_queue" to "service_role";

grant truncate on table "public"."email_queue" to "service_role";

grant update on table "public"."email_queue" to "service_role";

grant delete on table "public"."fish_info" to "anon";

grant insert on table "public"."fish_info" to "anon";

grant references on table "public"."fish_info" to "anon";

grant select on table "public"."fish_info" to "anon";

grant trigger on table "public"."fish_info" to "anon";

grant truncate on table "public"."fish_info" to "anon";

grant update on table "public"."fish_info" to "anon";

grant delete on table "public"."fish_info" to "authenticated";

grant insert on table "public"."fish_info" to "authenticated";

grant references on table "public"."fish_info" to "authenticated";

grant select on table "public"."fish_info" to "authenticated";

grant trigger on table "public"."fish_info" to "authenticated";

grant truncate on table "public"."fish_info" to "authenticated";

grant update on table "public"."fish_info" to "authenticated";

grant delete on table "public"."fish_info" to "service_role";

grant insert on table "public"."fish_info" to "service_role";

grant references on table "public"."fish_info" to "service_role";

grant select on table "public"."fish_info" to "service_role";

grant trigger on table "public"."fish_info" to "service_role";

grant truncate on table "public"."fish_info" to "service_role";

grant update on table "public"."fish_info" to "service_role";

create policy "Enable admin access to email_queue"
on "public"."email_queue"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "fish_data_read_policy"
on "public"."fish_data"
as permissive
for select
to anon
using (true);


create policy "Enable delete for default user"
on "public"."fish_images"
as permissive
for delete
to public
using ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


create policy "Enable insert for default user"
on "public"."fish_images"
as permissive
for insert
to public
with check ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


create policy "Enable update for default user"
on "public"."fish_images"
as permissive
for update
to public
using ((user_id = '00000000-0000-0000-0000-000000000000'::uuid))
with check ((user_id = '00000000-0000-0000-0000-000000000000'::uuid));


create policy "Users can create their own fish images"
on "public"."fish_images"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can delete their own fish images"
on "public"."fish_images"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update their own fish images"
on "public"."fish_images"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own fish images"
on "public"."fish_images"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Enable admin write access"
on "public"."fish_info"
as permissive
for all
to authenticated
using (((auth.jwt() ->> 'role'::text) = 'admin'::text))
with check (((auth.jwt() ->> 'role'::text) = 'admin'::text));


create policy "Enable read access for all users"
on "public"."fish_info"
as permissive
for select
to public
using (true);


create policy "order_items_insert_policy"
on "public"."order_items"
as permissive
for insert
to anon
with check (true);


create policy "order_items_read_policy"
on "public"."order_items"
as permissive
for select
to anon
using (true);


create policy "order_status_history_insert_policy"
on "public"."order_status_history"
as permissive
for insert
to anon
with check (true);


create policy "order_status_history_read_policy"
on "public"."order_status_history"
as permissive
for select
to anon
using (true);


create policy "orders_insert_policy"
on "public"."orders"
as permissive
for insert
to anon
with check (true);


create policy "orders_read_policy"
on "public"."orders"
as permissive
for select
to anon
using (true);


create policy "shipping_options_read_policy"
on "public"."shipping_options"
as permissive
for select
to anon
using ((is_active = true));


CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON public.email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fish_info_updated_at BEFORE UPDATE ON public.fish_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


