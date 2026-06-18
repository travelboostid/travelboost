<?php

namespace App\Enums;

enum AdPlatformConnectionStatus: string
{
    case PendingPlatformSetup = 'pending_platform_setup';
    case PendingProvisioning = 'pending_provisioning';
    case Connected = 'connected';
    case ProvisioningFailed = 'provisioning_failed';
    case Disconnected = 'disconnected';
}
