import { createAgent, grok } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const CodeAgent = createAgent({
      name: "code-agent",
      system:
        "Eres un experto en next.js y typescript. Tu escribes fragmentos simples de Nextjs y React.js ambos con Typescript.",
      model: grok({ model: "grok-3-mini" }),
    });

    const { output } = await CodeAgent.run(`Escribe un snippet para: ${event.data.value}`);

    return { output };
  }
);
