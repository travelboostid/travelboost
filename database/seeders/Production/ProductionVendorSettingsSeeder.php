<?php

namespace Database\Seeders\Production;

use App\Models\AgentTier;
use App\Models\Company;
use App\Models\CompanySettings;
use App\Models\ProductCommissionCategory;
use App\Models\TourCategory;
use App\Models\TourCommissionRule;
use App\Models\VisaCategory;
use App\Models\VisaCategoryItem;
use Illuminate\Database\Seeder;

class ProductionVendorSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $vendorUsernames = ['grandchinatravel', 'islamicchinatravel'];
        $vendors = Company::query()->whereIn('username', $vendorUsernames)->get();

        foreach ($vendors as $vendor) {
            // 1. Company Settings
            CompanySettings::query()->updateOrCreate(
                ['company_id' => $vendor->id],
                [
                    'booking_entry_time_limit' => 15,
                    'booking_deadline' => 10,
                    'document_completed_deadline' => 15,
                    'minimum_down_payment' => 0,
                    'minimum_down_payment_value' => 5000000,
                    'minimum_vat' => 1.1,
                    'full_payment_deadline' => 14,
                    'manual_bank_transfer' => 'BCA',
                    'manual_bank_transfer_account_name' => 'PT. Sentosa Cahaya Kemilau',
                    'manual_bank_transfer_account_number' => '6044861288',
                ]
            );

            // 2. Product Category (TourCategory)
            $tourCategoriesData = [
                ['name' => 'Super Best Saver', 'position_no' => 1, 'manual_reserved_limit_value' => 5, 'manual_reserved_limit_unit' => 'minute'],
                ['name' => 'Best Saver', 'position_no' => 2, 'manual_reserved_limit_value' => 3, 'manual_reserved_limit_unit' => 'minute'],
                ['name' => 'Uji Coba', 'position_no' => 3, 'manual_reserved_limit_value' => 1, 'manual_reserved_limit_unit' => 'minute'],
            ];

            foreach ($tourCategoriesData as $catData) {
                TourCategory::query()->updateOrCreate(
                    ['company_id' => $vendor->id, 'name' => $catData['name']],
                    $catData
                );
            }

            // 3. Visa Category & Items
            $visaCategory = VisaCategory::query()->updateOrCreate(
                ['company_id' => $vendor->id, 'name' => 'Visa Group A'],
                ['slug' => 'visa-group-a']
            );

            $visaItems = [
                ['description' => 'VOA', 'price' => 980000, 'is_taxable' => true, 'sort_order' => 1],
                ['description' => 'Visa Group', 'price' => 980000, 'is_taxable' => true, 'sort_order' => 2],
                ['description' => 'Ready Visa', 'price' => 480000, 'is_taxable' => true, 'sort_order' => 3],
            ];

            foreach ($visaItems as $visaItem) {
                VisaCategoryItem::query()->updateOrCreate(
                    ['visa_category_id' => $visaCategory->id, 'description' => $visaItem['description']],
                    $visaItem
                );
            }

            // 4. Agent Category (AgentTier)
            $agentTiersData = [
                ['name' => 'Wholesaler', 'slug' => 'wholesaler', 'sort_order' => 1, 'is_active' => true],
                ['name' => 'Big Agent', 'slug' => 'big-agent', 'sort_order' => 2, 'is_active' => true],
                ['name' => 'General Agent', 'slug' => 'general-agent', 'sort_order' => 3, 'is_active' => true],
            ];

            $agentTierModels = [];
            foreach ($agentTiersData as $atData) {
                $agentTierModels[$atData['name']] = AgentTier::query()->updateOrCreate(
                    ['company_id' => $vendor->id, 'name' => $atData['name']],
                    $atData
                );
            }

            // 5. Product Commission Category
            $productCommissionCategoriesData = [
                ['category_name' => 'Super Best Saver', 'slug' => 'super-best-saver', 'sort_order' => 1, 'is_active' => true],
                ['category_name' => 'Best Saver', 'slug' => 'best-saver', 'sort_order' => 2, 'is_active' => true],
                ['category_name' => 'Umum', 'slug' => 'umum', 'sort_order' => 3, 'is_active' => true],
            ];

            $productCategoryModels = [];
            foreach ($productCommissionCategoriesData as $pccData) {
                $productCategoryModels[$pccData['category_name']] = ProductCommissionCategory::query()->updateOrCreate(
                    ['company_id' => $vendor->id, 'category_name' => $pccData['category_name']],
                    $pccData
                );
            }

            // 6. Base Commission (TourCommissionRule)
            $commissionRules = [
                ['agent' => 'Wholesaler', 'product' => 'Super Best Saver', 'value' => 600000],
                ['agent' => 'Wholesaler', 'product' => 'Best Saver', 'value' => 700000],
                ['agent' => 'Wholesaler', 'product' => 'Umum', 'value' => 1000000],
                ['agent' => 'Big Agent', 'product' => 'Super Best Saver', 'value' => 600000],
                ['agent' => 'Big Agent', 'product' => 'Best Saver', 'value' => 700000],
                ['agent' => 'Big Agent', 'product' => 'Umum', 'value' => 1000000],
                ['agent' => 'General Agent', 'product' => 'Super Best Saver', 'value' => 400000],
                ['agent' => 'General Agent', 'product' => 'Best Saver', 'value' => 500000],
                ['agent' => 'General Agent', 'product' => 'Umum', 'value' => 700000],
            ];

            foreach ($commissionRules as $ruleData) {
                $agentTier = $agentTierModels[$ruleData['agent']];
                $productCat = $productCategoryModels[$ruleData['product']];

                TourCommissionRule::query()->updateOrCreate(
                    [
                        'company_id' => $vendor->id,
                        'tour_id' => null,
                        'agent_tier_id' => $agentTier->id,
                        'product_commission_category_id' => $productCat->id,
                    ],
                    [
                        'commission_type' => 'nominal',
                        'commission_value' => $ruleData['value'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
