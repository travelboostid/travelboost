<?php

namespace App\Services;

use App\Enums\AdPlatformConnectionStatus;
use App\Models\Company;

class LinkedAccountsService
{
    /**
     * @return array<int, array{
     *     type: string,
     *     title: string,
     *     description: string,
     *     accounts: array<int, array{
     *         id: int,
     *         email: string|null,
     *         name: string|null,
     *         connected_at: string|null,
     *         integrations: array<int, array{
     *             key: string,
     *             label: string,
     *             status: string,
     *             detail: string|null,
     *             meta: array<string, string|null>,
     *         }>,
     *     }>,
     * }>
     */
    public function getAccountGroups(Company $company): array
    {
        return [
            $this->googleAccountGroup($company),
            $this->metaAccountGroup($company),
        ];
    }

    /**
     * @return array{
     *     type: string,
     *     title: string,
     *     description: string,
     *     accounts: array<int, array{
     *         id: int,
     *         email: string|null,
     *         name: string|null,
     *         connected_at: string|null,
     *         integrations: array<int, array{
     *             key: string,
     *             label: string,
     *             status: string,
     *             detail: string|null,
     *             meta: array<string, string|null>,
     *         }>,
     *     }>,
     * }
     */
    private function googleAccountGroup(Company $company): array
    {
        $googleAccount = $company->googleAccount()
            ->with('analyticsConnection')
            ->first();

        $googleAds = $company->googleAdsConnection()->first();

        $accounts = [];

        if ($googleAccount !== null) {
            $analytics = $googleAccount->analyticsConnection;

            $integrations = [
                [
                    'key' => 'google_account',
                    'label' => 'Google sign-in',
                    'status' => 'connected',
                    'detail' => $googleAccount->email,
                    'meta' => [
                        'google_id' => $googleAccount->google_id,
                    ],
                ],
            ];

            if ($analytics !== null) {
                $integrations[] = [
                    'key' => 'google_analytics',
                    'label' => 'Google Analytics',
                    'status' => 'connected',
                    'detail' => $analytics->measurement_id,
                    'meta' => [
                        'property_id' => $analytics->property_id,
                        'data_stream_id' => $analytics->data_stream_id,
                        'website_url' => $analytics->website_url,
                    ],
                ];
            } else {
                $integrations[] = [
                    'key' => 'google_analytics',
                    'label' => 'Google Analytics',
                    'status' => 'not_connected',
                    'detail' => null,
                    'meta' => [],
                ];
            }

            if ($googleAds !== null && $googleAds->status->value === 'connected') {
                $integrations[] = [
                    'key' => 'google_ads',
                    'label' => 'Google Ads',
                    'status' => 'connected',
                    'detail' => $googleAds->external_account_id,
                    'meta' => [
                        'external_account_name' => $googleAds->external_account_name,
                        'provisioned_at' => $googleAds->provisioned_at?->toIso8601String(),
                    ],
                ];
            } elseif ($googleAds !== null) {
                $integrations[] = [
                    'key' => 'google_ads',
                    'label' => 'Google Ads',
                    'status' => 'pending',
                    'detail' => $googleAds->status->value,
                    'meta' => [
                        'message' => data_get($googleAds->meta, 'message'),
                    ],
                ];
            } else {
                $integrations[] = [
                    'key' => 'google_ads',
                    'label' => 'Google Ads',
                    'status' => 'not_connected',
                    'detail' => null,
                    'meta' => [],
                ];
            }

            $accounts[] = [
                'id' => $googleAccount->id,
                'email' => $googleAccount->email,
                'name' => $googleAccount->name,
                'connected_at' => $googleAccount->created_at?->toIso8601String(),
                'integrations' => $integrations,
            ];
        }

        return [
            'type' => 'google',
            'title' => 'Google',
            'description' => 'Sign in, Analytics, and other Google integrations for your company.',
            'accounts' => $accounts,
        ];
    }

    /**
     * @return array{
     *     type: string,
     *     title: string,
     *     description: string,
     *     accounts: array<int, array{
     *         id: int,
     *         email: string|null,
     *         name: string|null,
     *         connected_at: string|null,
     *         integrations: array<int, array{
     *             key: string,
     *             label: string,
     *             status: string,
     *             detail: string|null,
     *             meta: array<string, string|null>,
     *         }>,
     *     }>,
     * }
     */
    private function metaAccountGroup(Company $company): array
    {
        $facebookAccount = $company->facebookAccount;
        $pixel = $company->metaPixelConnection;
        $metaAds = $company->metaAdsConnection()->first();

        $accounts = [];

        if ($facebookAccount !== null) {
            $integrations = [
                [
                    'key' => 'facebook_account',
                    'label' => 'Facebook sign-in',
                    'status' => 'connected',
                    'detail' => $facebookAccount->email,
                    'meta' => [
                        'facebook_id' => $facebookAccount->facebook_id,
                    ],
                ],
            ];

            if ($pixel !== null) {
                $integrations[] = [
                    'key' => 'meta_pixel',
                    'label' => 'Meta Pixel',
                    'status' => 'connected',
                    'detail' => $pixel->pixel_id,
                    'meta' => [
                        'pixel_name' => $pixel->pixel_name,
                        'connection_source' => $pixel->connection_source->value,
                        'website_url' => $pixel->website_url,
                    ],
                ];
            } else {
                $integrations[] = [
                    'key' => 'meta_pixel',
                    'label' => 'Meta Pixel',
                    'status' => 'not_connected',
                    'detail' => null,
                    'meta' => [],
                ];
            }

            if ($metaAds?->status === AdPlatformConnectionStatus::Connected) {
                $integrations[] = [
                    'key' => 'meta_ads',
                    'label' => 'Meta Ads',
                    'status' => 'connected',
                    'detail' => $metaAds->external_account_id,
                    'meta' => [],
                ];
            } elseif ($metaAds !== null) {
                $integrations[] = [
                    'key' => 'meta_ads',
                    'label' => 'Meta Ads',
                    'status' => 'pending',
                    'detail' => $metaAds->status->value,
                    'meta' => [
                        'message' => data_get($metaAds->meta, 'message'),
                    ],
                ];
            } else {
                $integrations[] = [
                    'key' => 'meta_ads',
                    'label' => 'Meta Ads',
                    'status' => 'not_connected',
                    'detail' => null,
                    'meta' => [],
                ];
            }

            $accounts[] = [
                'id' => $facebookAccount->id,
                'email' => $facebookAccount->email,
                'name' => $facebookAccount->name,
                'connected_at' => $facebookAccount->created_at?->toIso8601String(),
                'integrations' => $integrations,
            ];
        } elseif ($pixel !== null) {
            $accounts[] = [
                'id' => $pixel->id,
                'email' => null,
                'name' => 'Manual Meta Pixel',
                'connected_at' => $pixel->created_at?->toIso8601String(),
                'integrations' => [
                    [
                        'key' => 'facebook_account',
                        'label' => 'Facebook sign-in',
                        'status' => 'not_connected',
                        'detail' => null,
                        'meta' => [],
                    ],
                    [
                        'key' => 'meta_pixel',
                        'label' => 'Meta Pixel',
                        'status' => 'connected',
                        'detail' => $pixel->pixel_id,
                        'meta' => [
                            'pixel_name' => $pixel->pixel_name,
                            'connection_source' => $pixel->connection_source->value,
                            'website_url' => $pixel->website_url,
                        ],
                    ],
                ],
            ];
        }

        return [
            'type' => 'meta',
            'title' => 'Meta',
            'description' => 'Facebook sign-in, Meta Pixel tracking, and pixel insights for your company.',
            'accounts' => $accounts,
        ];
    }
}
