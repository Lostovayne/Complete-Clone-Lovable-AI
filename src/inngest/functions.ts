import { createAgent, createNetwork, createTool, grok } from "@inngest/agent-kit";
import z from "zod";
import { inngest } from "./client";

import { PROMPT } from "@/prompt";
import { Sandbox } from "@e2b/code-interpreter";
import { getSanbox, lastAssitantTextMessageContent } from "./utils";

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
      description: "an expert coding angent",
      system: PROMPT,
      model: grok({ model: "grok-3-latest" }),
      // model: gemini({ model: "gemini-2.5-pro" }),
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
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandobx = await getSanbox(sandboxId);
                const contents = [];

                for (const file of files) {
                  const content = await sandobx.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "ERROR: " + error;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssitantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [CodeAgent],
      maxIter: 15, // max cantidad de iteraciones del agente
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return CodeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSanbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `http://${host}`;
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
