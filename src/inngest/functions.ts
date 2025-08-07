import { createAgent, createTool, grok } from "@inngest/agent-kit";
import z from "zod";
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
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSanbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                console.error(
                  `Command failed with error: ${error}\n stdout: ${buffers.stdout} \n sstderror: ${buffers.stderr}`
                );
                return `Command failed with error: ${error}\n stdout: ${buffers.stdout} \n sstderror: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSanbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content); // archivos creados
                  updatedFiles[file.path] = file.content; // seguimiento de los archivos actualizados
                }

                return updatedFiles;
              } catch (error) {
                console.log(`Error creating or updating files: ${error}`);
                return "Error creating or updating files: " + error;
              }
            });
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles; // Actualiza el estado de la red con los archivos actualizados
            }
          },
        }),
      ],
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
