import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSanbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}

export function lastAssitantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );
  const message = result.output[lastAssistantTextMessageIndex] as TextMessage | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}
