import { RetinueProvider, useRunSubscription, useSendMessage } from "@retinue/react";
import type { RetinueClient } from "@retinue/react";

export function Chat({ client }: { client: RetinueClient }) {
  return (
    <RetinueProvider client={client}>
      <Conversation />
    </RetinueProvider>
  );
}

function Conversation() {
  const { parts } = useRunSubscription({ runId: "run-1", conversationId: "conversation-1" });
  const { send, sending } = useSendMessage({ conversationId: "conversation-1" });
  return <button disabled={sending} onClick={() => void send("Hello")}>{parts.length} parts</button>;
}
