import { createAgent, createNetwork, createTool, gemini, Tool } from "@inngest/agent-kit";
import z from "zod";
import { inngest } from "./client";

import { prisma } from "@/lib/db";
import { PROMPT } from "@/prompt";
import { Sandbox } from "@e2b/code-interpreter";
import { getSanbox, lastAssitantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("generate-sandbox-id", async () => {
      const sandox = await Sandbox.create("vibe-nextjs");
      return sandox.sandboxId;
    });

    const CodeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "an expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-pro" }),
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
                  `Command failed with error: ${error}\n stdout: ${buffers.stdout} \n sstderror: ${buffers.stderr}`,
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
              }),
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
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

    const network = createNetwork<AgentState>({
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

    const isError =
      !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSanbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Guardar en prisma
    await step.run("save-result", async () => {
      // Comprobar si hay un error
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong, Please try again",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
