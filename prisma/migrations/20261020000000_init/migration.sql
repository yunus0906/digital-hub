-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('provider', 'developer', 'brand', 'operator');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('airport', 'client_app', 'proxy_core', 'vps_plan', 'ai_model', 'dev_service');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "DataStatus" AS ENUM ('verified', 'community_submitted', 'auto_collected', 'stale', 'disputed', 'unknown');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('official', 'purchase', 'github', 'download', 'docs', 'status_page', 'other');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('official', 'api', 'github', 'manual', 'community');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('month', 'quarter', 'half_year', 'year', 'one_time', 'usage', 'hour', 'custom');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CNY', 'USD', 'EUR', 'HKD', 'JPY');

-- CreateEnum
CREATE TYPE "TrafficType" AS ENUM ('fixed', 'unlimited', 'usage_based', 'unknown');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('active', 'maintenance', 'suspended', 'discontinued', 'unknown');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('client', 'core', 'rules_tool', 'helper', 'other');

-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('open_source', 'closed_source', 'partial_source', 'incomplete_source', 'undisclosed', 'license_unconfirmed');

-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('free', 'paid', 'freemium', 'unknown');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('active', 'low_activity', 'discontinued', 'unknown');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('full', 'partial', 'planned', 'unknown');

-- CreateEnum
CREATE TYPE "VpsProductType" AS ENUM ('vps', 'cloud_vm', 'dedicated_server', 'gpu_server', 'other');

-- CreateEnum
CREATE TYPE "CpuSharing" AS ENUM ('shared', 'dedicated', 'burstable', 'unknown');

-- CreateEnum
CREATE TYPE "TrafficDirection" AS ENUM ('inbound', 'outbound', 'both', 'unknown');

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "vendorType" "VendorType" NOT NULL DEFAULT 'brand',
    "status" "ProductStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "category" "ProductCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "official_url" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "data_status" "DataStatus" NOT NULL DEFAULT 'unknown',
    "last_verified_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_links" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "product_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "source_url" TEXT,
    "terms_url" TEXT,
    "reliability_level" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_data_sources" (
    "product_id" TEXT NOT NULL,
    "data_source_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "source_url" TEXT,
    "collected_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "raw_value" JSONB,

    CONSTRAINT "product_data_sources_pkey" PRIMARY KEY ("product_id","data_source_id","field_key")
);

-- CreateTable
CREATE TABLE "price_records" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'CNY',
    "billing_period" "BillingPeriod" NOT NULL,
    "billing_period_days" INTEGER,
    "is_promotional" BOOLEAN NOT NULL DEFAULT false,
    "promotion_end_at" TIMESTAMP(3),
    "renewal_amount" DECIMAL(12,2),
    "usage_unit" TEXT,
    "source_url" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history_events" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "event_type" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "source_url" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airport_details" (
    "product_id" TEXT NOT NULL,
    "traffic_type" "TrafficType" NOT NULL DEFAULT 'unknown',
    "monthly_traffic_gb" INTEGER,
    "device_limit" INTEGER,
    "group_member_count" INTEGER,
    "group_member_count_observed_at" TIMESTAMP(3),
    "refund_policy" TEXT,
    "trial_available" BOOLEAN,
    "service_status" "ServiceStatus" NOT NULL DEFAULT 'unknown',
    "notes" TEXT,

    CONSTRAINT "airport_details_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "airport_plans" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billing_period" "BillingPeriod" NOT NULL,
    "price_record_id" TEXT,
    "traffic_type" "TrafficType" NOT NULL DEFAULT 'unknown',
    "traffic_gb" INTEGER,
    "device_limit" INTEGER,
    "reset_policy" TEXT,
    "renewal_terms" TEXT,
    "purchase_url" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airport_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airport_network_tests" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "test_region" TEXT NOT NULL,
    "test_network" TEXT,
    "latency_ms" INTEGER,
    "download_mbps" INTEGER,
    "upload_mbps" INTEGER,
    "packet_loss_percent" DECIMAL(5,2),
    "test_method" TEXT NOT NULL,
    "sample_size" INTEGER,
    "tested_at" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT,
    "notes" TEXT,

    CONSTRAINT "airport_network_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_applications" (
    "product_id" TEXT NOT NULL,
    "application_type" "ApplicationType" NOT NULL DEFAULT 'client',
    "code_status" "CodeStatus" NOT NULL DEFAULT 'license_unconfirmed',
    "license_name" TEXT,
    "price_status" "PriceStatus" NOT NULL DEFAULT 'unknown',
    "maintenance_status" "MaintenanceStatus" NOT NULL DEFAULT 'unknown',
    "repository_url" TEXT,
    "latest_release_at" TIMESTAMP(3),
    "last_commit_at" TIMESTAMP(3),
    "stars_count" INTEGER,
    "forks_count" INTEGER,
    "metrics_observed_at" TIMESTAMP(3),

    CONSTRAINT "client_applications_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "client_platforms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "client_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_application_platforms" (
    "product_id" TEXT NOT NULL,
    "platform_id" TEXT NOT NULL,
    "support_status" "SupportStatus" NOT NULL DEFAULT 'full',
    "notes" TEXT,

    CONSTRAINT "client_application_platforms_pkey" PRIMARY KEY ("product_id","platform_id")
);

-- CreateTable
CREATE TABLE "proxy_cores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "official_url" TEXT,
    "repository_url" TEXT,
    "license_name" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'published',

    CONSTRAINT "proxy_cores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_core_compatibility" (
    "client_product_id" TEXT NOT NULL,
    "core_id" TEXT NOT NULL,
    "compatibility_status" "SupportStatus" NOT NULL DEFAULT 'unknown',
    "supported_version_range" TEXT,
    "notes" TEXT,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "client_core_compatibility_pkey" PRIMARY KEY ("client_product_id","core_id")
);

-- CreateTable
CREATE TABLE "client_releases" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "released_at" TIMESTAMP(3) NOT NULL,
    "release_url" TEXT,
    "download_url" TEXT,
    "changelog" TEXT,
    "source_id" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vps_locations" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "city" TEXT,
    "datacenter_name" TEXT,
    "region_code" TEXT,
    "notes" TEXT,

    CONSTRAINT "vps_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vps_plans" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "product_type" "VpsProductType" NOT NULL DEFAULT 'vps',
    "virtualization_type" TEXT,
    "cpu_model" TEXT,
    "cpu_architecture" TEXT,
    "vcpu_count" INTEGER,
    "cpu_sharing" "CpuSharing" NOT NULL DEFAULT 'unknown',
    "memory_mb" INTEGER,
    "storage_gb" INTEGER,
    "storage_type" TEXT,
    "bandwidth_mbps" INTEGER,
    "bandwidth_type" TEXT,
    "traffic_gb" INTEGER,
    "traffic_direction" "TrafficDirection" NOT NULL DEFAULT 'unknown',
    "ipv4_count" INTEGER,
    "ipv6_supported" BOOLEAN,
    "virtualization_notes" TEXT,
    "refund_policy" TEXT,
    "availability_status" TEXT,
    "purchase_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vps_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vps_network_tests" (
    "id" TEXT NOT NULL,
    "vps_plan_id" TEXT NOT NULL,
    "test_location" TEXT NOT NULL,
    "isp" TEXT,
    "latency_ms" INTEGER,
    "download_mbps" INTEGER,
    "upload_mbps" INTEGER,
    "packet_loss_percent" DECIMAL(5,2),
    "route_type" TEXT,
    "test_tool" TEXT NOT NULL,
    "tested_at" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT,
    "notes" TEXT,

    CONSTRAINT "vps_network_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_status_published_at_idx" ON "products"("category", "status", "published_at");

-- CreateIndex
CREATE INDEX "products_status_deleted_at_idx" ON "products"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "products_vendor_id_idx" ON "products"("vendor_id");

-- CreateIndex
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

-- CreateIndex
CREATE INDEX "product_links_product_id_idx" ON "product_links"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "price_records_product_id_valid_from_idx" ON "price_records"("product_id", "valid_from");

-- CreateIndex
CREATE INDEX "price_records_product_id_billing_period_idx" ON "price_records"("product_id", "billing_period");

-- CreateIndex
CREATE INDEX "price_history_events_product_id_observed_at_idx" ON "price_history_events"("product_id", "observed_at");

-- CreateIndex
CREATE INDEX "reviews_product_id_status_idx" ON "reviews"("product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_product_id_key" ON "favorites"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "airport_plans_product_id_status_idx" ON "airport_plans"("product_id", "status");

-- CreateIndex
CREATE INDEX "airport_network_tests_product_id_tested_at_idx" ON "airport_network_tests"("product_id", "tested_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_platforms_code_key" ON "client_platforms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "proxy_cores_slug_key" ON "proxy_cores"("slug");

-- CreateIndex
CREATE INDEX "client_releases_product_id_released_at_idx" ON "client_releases"("product_id", "released_at");

-- CreateIndex
CREATE INDEX "vps_locations_vendor_id_idx" ON "vps_locations"("vendor_id");

-- CreateIndex
CREATE INDEX "vps_locations_country_code_idx" ON "vps_locations"("country_code");

-- CreateIndex
CREATE INDEX "vps_plans_product_id_idx" ON "vps_plans"("product_id");

-- CreateIndex
CREATE INDEX "vps_plans_location_id_idx" ON "vps_plans"("location_id");

-- CreateIndex
CREATE INDEX "vps_plans_product_type_idx" ON "vps_plans"("product_type");

-- CreateIndex
CREATE INDEX "vps_network_tests_vps_plan_id_tested_at_idx" ON "vps_network_tests"("vps_plan_id", "tested_at");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_data_sources" ADD CONSTRAINT "product_data_sources_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_data_sources" ADD CONSTRAINT "product_data_sources_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_records" ADD CONSTRAINT "price_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history_events" ADD CONSTRAINT "price_history_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airport_details" ADD CONSTRAINT "airport_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airport_plans" ADD CONSTRAINT "airport_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airport_network_tests" ADD CONSTRAINT "airport_network_tests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_applications" ADD CONSTRAINT "client_applications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_application_platforms" ADD CONSTRAINT "client_application_platforms_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "client_applications"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_application_platforms" ADD CONSTRAINT "client_application_platforms_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "client_platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_core_compatibility" ADD CONSTRAINT "client_core_compatibility_client_product_id_fkey" FOREIGN KEY ("client_product_id") REFERENCES "client_applications"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_core_compatibility" ADD CONSTRAINT "client_core_compatibility_core_id_fkey" FOREIGN KEY ("core_id") REFERENCES "proxy_cores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_releases" ADD CONSTRAINT "client_releases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vps_locations" ADD CONSTRAINT "vps_locations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vps_plans" ADD CONSTRAINT "vps_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vps_plans" ADD CONSTRAINT "vps_plans_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vps_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vps_network_tests" ADD CONSTRAINT "vps_network_tests_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

