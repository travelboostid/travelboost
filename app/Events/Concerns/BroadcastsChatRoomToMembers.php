<?php

namespace App\Events\Concerns;

use App\Models\ChatRoom;
use App\Models\Company;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

trait BroadcastsChatRoomToMembers
{
    /**
     * @return array<int, Channel|PrivateChannel>
     */
    protected function chatRoomChannels(ChatRoom $room): array
    {
        $channels = [];

        $channels[] = new PrivateChannel("rooms.{$room->id}");

        $room->loadMissing('members');

        foreach ($room->members as $member) {
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
