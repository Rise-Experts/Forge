import { ForgeProvider, useRunSubscription, useSendMessage } from "@retinue/react";
import type { ForgeClient } from "@retinue/react";

export function Chat({ client }: { client: ForgeClient }) {
  return (
    <ForgeProvider client={client}>
      <Conversation />
    </ForgeProvider>
  );
}

function Conversation() {
  const { parts } = useRunSubscription({ runId: "run-1", conversationId: "conversation-1" });
  const { send, sending } = useSendMessage({ conversationId: "conversation-1" });
  return <button disabled={sending} onClick={() => void send("Hello")}>{parts.length} parts</button>;
}
