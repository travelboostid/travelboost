<?php

namespace App\Events\Concerns;

use App\Models\ChatMessage;
use App\Models\Company;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

trait BroadcastsChatMessageToMembers
{
    /**
     * @return array<int, Channel|PrivateChannel>
     */
    protected function chatMessageChannels(ChatMessage $message): array
    {
        $channels = [];

        $channels[] = new PrivateChannel("rooms.{$message->room_id}");

        $message->loadMissing('room.members');

        foreach ($message->room->members as $member) {
            if ($member->member_type === 'user') {
                $channels[] = new PrivateChannel("users.{$member->member_id}");
            } elseif ($member->member_type === 'anonymous-user') {
                $channels[] = new Channel("anonymous-users.{$member->member_id}");
            } elseif ($member->member_type === 'company') {
                /** @var Company $company */
                $company = $member->member;
                foreach ($company->teams()->get() as $team) {
                    $channels[] = new PrivateChannel("users.{$team->user_id}");
                }
            }
        }

        return $channels;
    }
}
