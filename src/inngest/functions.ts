import { createAgent, grok } from "@inngest/agent-kit";
import { inngest } from "./client";

import { Sandbox } from "@e2b/code-interpreter";
import { getSanbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("generate-sandbox-id", async () => {
      const sandox = await Sandbox.create("vibe-nextjs-test-20");
      return sandox.sandboxId;
    });

    const CodeAgent = createAgent({
      name: "code-agent",
      system:
        "Eres un experto en next.js y typescript. Tu escribes fragmentos simples de Nextjs y React.js ambos con Typescript.",
      model: grok({ model: "grok-3-mini" }),
    });

    const { output } = await CodeAgent.run(`Escribe un snippet para: ${event.data.value}`);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSanbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    return { output, sandboxUrl };
  }
);
