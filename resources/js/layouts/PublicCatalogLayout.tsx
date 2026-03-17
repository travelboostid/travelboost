import {
  TooltipProvider
} from '@/components/ui/tooltip'

import {
  ChatContextProvider
} from '@/components/chat/state'

import {
  FloatingChatWidgetContextProvider
} from '@/components/chat/state'

import FloatingChatWidget from '@/components/chat/Floating-Chat-Widget'

export default function PublicCatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <ChatContextProvider>
        <FloatingChatWidgetContextProvider>

          <div className="min-h-screen bg-background">

            {/* HEADER */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold">
                TravelBoost
              </h1>
            </div>

            {/* CONTENT */}
            <main className="p-4">
              {children}
            </main>

          </div>

          <FloatingChatWidget />

        </FloatingChatWidgetContextProvider>
      </ChatContextProvider>
    </TooltipProvider>
  )
}