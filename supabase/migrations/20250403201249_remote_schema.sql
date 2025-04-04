drop index if exists "public"."idx_fish_data_archived";

drop index if exists "public"."idx_fish_data_category_archived";

drop index if exists "public"."idx_fish_data_category_disabled";

drop index if exists "public"."idx_fish_data_ebay_listing_id";

drop index if exists "public"."idx_fish_data_order_index";

drop index if exists "public"."idx_fish_data_qtyoh";

alter table "public"."fish_data" drop column "archived";

alter table "public"."fish_data" drop column "archived_at";

alter table "public"."fish_data" drop column "ebay_listing_id";

alter table "public"."fish_data" drop column "ebay_listing_status";

alter table "public"."fish_data" drop column "is_category";

alter table "public"."fish_data" drop column "order_index";

alter table "public"."fish_data" drop column "qtyoh";


