import { configureEchoNow } from '@/lib/configure-echo';
import { CHAT_ECHO_READY_EVENT } from '@/lib/echo-paths';

export function activateChatStack(): void {
    configureEchoNow();
    window.dispatchEvent(new Event(CHAT_ECHO_READY_EVENT));
}
