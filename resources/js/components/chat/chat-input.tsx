import type { StoreChatMessageRequest } from '@/api/model';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import { useFloatingChatWidgetContext, useSendMessage } from './state';

function RenderAttachment({ attachment }: { attachment: any }) {
  const { type, data } = attachment;
  if (type === 'tour') {
    return (
      <div className="p-4">
        <div>You want to asking about:</div>
        <div>{data.name}</div>
      </div>
    );
  }
  return null;
}

export default function ChatInput({
  roomId,
  className,
}: {
  roomId: number;
  className?: string;
}) {
  const sendMessage = useSendMessage();
  const { message, setMessage, attachment, setAttachment } =
    useFloatingChatWidgetContext();
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    try {
      setSending(true);

      await sendMessage(roomId, buildData());
      setAttachment(null);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const buildData = () => {
    const data: StoreChatMessageRequest = { message: message.trim() };
    if (!attachment) return data;
    if (attachment.type === 'tour') {
      data.attachment_type = 'tour';
      data.attachment = String(attachment.data.id);
    }
    return data;
  };
  return (
    <div className={cn('divide-y border-t', className)}>
      {attachment && <RenderAttachment attachment={attachment} />}
      <div className="flex gap-3 p-4">
        <Input
          disabled={sending}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Write your message..."
          className="flex-1"
        />
        <Button
          disabled={sending}
          onClick={() => handleSendMessage()}
          className="flex-none"
        >
          {sending ? <Spinner /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </div>
  );
}
