alter table "public"."Post" drop constraint "Post_pkey";

drop index if exists "public"."Post_pkey";

drop table "public"."Post";

drop sequence if exists "public"."Post_id_seq";


