import { createStaticCredentialResolver } from "@retinue/agentkit/tools";
import { createSlackToolkit } from "@retinue/tools-slack";

// A credential reference is resolved at execution time; never put a token in a prompt.
export const slackToolkit = createSlackToolkit({
  credentialRef: "slack-bot-token",
  resolver: createStaticCredentialResolver({ "slack-bot-token": "token-for-local-fixture" }),
});
