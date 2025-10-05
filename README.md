# 🚀 Lovable AI Clone

A modern, full-stack AI-powered development platform that enables code generation and execution in isolated sandbox environments. Built with Next.js 15, E2B Sandboxes, and cutting-edge AI technologies.

## ✨ Features

- **🤖 AI-Powered Code Generation**: Advanced code generation using LLM agents
- **📦 Isolated Sandbox Execution**: Secure code execution with E2B sandboxes
- **⚡ Real-time Development**: Live preview and instant feedback
- **🎨 Modern UI Components**: Built with shadcn/ui and Tailwind CSS
- **🔄 Background Processing**: Async task handling with Inngest
- **💾 Database Integration**: Prisma ORM with type-safe database operations
- **🔧 Type-Safe APIs**: End-to-end type safety with tRPC

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern React component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI primitives

### Backend & APIs
- **[tRPC](https://trpc.io/)** - Type-safe API layer
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM
- **[Inngest](https://www.inngest.com/)** - Durable functions and workflows

### AI & Sandboxes
- **[E2B Sandboxes](https://e2b.dev/)** - Secure code execution environments
- **[@inngest/agent-kit](https://github.com/inngest/agent-kit)** - AI agent framework
- **Custom Sandbox Template** - Pre-configured Next.js + shadcn/ui environment

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- **Docker** (for E2B sandbox development)
- **E2B Account** ([Sign up](https://e2b.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/lovable-ai-clone.git
   cd lovable-ai-clone
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   # Database
   DATABASE_URL="your-database-url"

   # E2B Configuration
   E2B_API_KEY="your-e2b-api-key"

   # Inngest
   INNGEST_EVENT_KEY="your-inngest-event-key"
   INNGEST_SIGNING_KEY="your-inngest-signing-key"

   # AI/LLM Configuration
   OPENAI_API_KEY="your-openai-api-key"
   # or other LLM provider keys
   ```

4. **Set up the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - The app will be running with hot reload enabled

## 🔧 Available Scripts

### Development
```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Database
```bash
pnpm prisma:generate   # Generate Prisma client
pnpm prisma:studio     # Open Prisma Studio
pnpm prisma:migrate    # Run database migrations
pnpm prisma:reset      # Reset database (development only)
```

### E2B Sandbox Management
```bash
pnpm e2b:status    # List all sandbox templates
pnpm e2b:build     # Build the sandbox template
pnpm e2b:publish   # Publish template to E2B
pnpm e2b:update    # Build and publish template
pnpm e2b:test      # Test template by creating a sandbox
```

## 🐳 E2B Sandbox Templates

This project includes a pre-configured E2B sandbox template optimized for Next.js development with shadcn/ui components.

### Current Template Configuration

- **Template Name**: `lovable-nextjs-v15`
- **Template ID**: `e7iat1qlfbulpw070973`
- **Base Image**: Node.js 21 Slim
- **Pre-installed**: Latest Next.js + Complete shadcn/ui component library
- **Resources**: 2 vCPUs, 1GB RAM

### Using the Sandbox Template

```typescript
import { Sandbox } from '@e2b/js-sdk'

// Create a new sandbox instance
const sandbox = await Sandbox.create('lovable-nextjs-v15')

// Execute commands
const result = await sandbox.commands.run('npm --version')
console.log(result.stdout)

// Create files
await sandbox.files.write('/home/user/app.js', 'console.log("Hello World")')

// Close the sandbox
await sandbox.close()
```

### Customizing the Sandbox Template

1. **Modify the Dockerfile**
   ```bash
   # Edit the sandbox configuration
   code sanbox-templates/nextjs/e2b.Dockerfile
   ```

2. **Update startup script**
   ```bash
   # Edit the compile script
   code sanbox-templates/nextjs/compile_page.sh
   ```

3. **Build and deploy**
   ```bash
   pnpm e2b:update
   ```

### Creating Your Own Template

1. **Initialize a new template**
   ```bash
   mkdir my-custom-template
   cd my-custom-template
   e2b template init
   ```

2. **Customize the Dockerfile**
   ```dockerfile
   FROM ubuntu:22.04

   # Install your dependencies
   RUN apt-get update && apt-get install -y \
       nodejs \
       npm \
       python3

   # Add your startup script
   COPY startup.sh /startup.sh
   RUN chmod +x /startup.sh
   ```

3. **Build and publish**
   ```bash
   e2b template build --name my-custom-template
   e2b template publish
   ```

## 🏗️ Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Custom components
│   ├── lib/                # Utility functions and configurations
│   ├── trpc/               # tRPC router and procedures
│   ├── inngest/            # Inngest functions and workflows
│   └── generated/          # Auto-generated files
├── prisma/                 # Database schema and migrations
├── sanbox-templates/       # E2B sandbox templates
│   └── nextjs/            # Next.js + shadcn/ui template
│       ├── e2b.Dockerfile # Sandbox environment definition
│       ├── e2b.toml       # Template configuration
│       └── compile_page.sh # Startup script
├── public/                 # Static assets
└── ...config files
```

## 🤖 AI Agent System

The project uses Inngest Agent Kit for building AI-powered workflows:

### Code Agent Function

```typescript
// Located in src/inngest/functions.ts
const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // Create a sandbox for code execution
    const sandboxId = await step.run("generate-sandbox-id", async () => {
      const sandbox = await Sandbox.create("lovable-nextjs-v15");
      return sandbox.sandboxId;
    });

    // Run AI agent with tools
    const result = await network.run(event.data.value);

    return {
      sandboxUrl: result.sandboxUrl,
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);
```

### Available Tools

- **Command Execution**: Run terminal commands in sandboxes
- **File Management**: Create, read, and update files
- **Code Generation**: AI-powered code creation and modification

## 🌐 Deployment

### Deploy to Vercel

1. **Connect your repository to Vercel**
   ```bash
   npx vercel
   ```

2. **Configure environment variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure database is accessible from Vercel

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Deploy with Docker

1. **Build the Docker image**
   ```bash
   docker build -t lovable-ai-clone .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e E2B_API_KEY="your-e2b-api-key" \
     lovable-ai-clone
   ```

## 🧪 Testing

### Unit Tests
```bash
pnpm test           # Run unit tests
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Generate coverage report
```

### E2B Sandbox Testing
```bash
pnpm e2b:test       # Test sandbox creation
```

### Integration Tests
```bash
pnpm test:e2e       # Run end-to-end tests
```

## 📚 API Documentation

### tRPC Procedures

The API is built with tRPC for type-safe client-server communication:

```typescript
// Example API call
const result = await trpc.code.generate.mutate({
  prompt: "Create a React component",
  framework: "nextjs"
});
```

### Available Endpoints

- `POST /api/trpc/code.generate` - Generate code with AI
- `GET /api/trpc/sandboxes.list` - List user sandboxes
- `POST /api/trpc/sandboxes.create` - Create new sandbox
- `DELETE /api/trpc/sandboxes.delete` - Delete sandbox

## 🔒 Security

- **Sandbox Isolation**: All code execution happens in isolated E2B sandboxes
- **Input Validation**: All inputs are validated with Zod schemas
- **Type Safety**: End-to-end type safety with TypeScript and tRPC
- **Environment Variables**: Sensitive data is stored in environment variables

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [E2B](https://e2b.dev/) for providing secure sandbox environments
- [Inngest](https://www.inngest.com/) for reliable background job processing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vercel](https://vercel.com/) for Next.js and deployment platform

## 📞 Support

- **Documentation**: [Project Wiki](https://github.com/your-username/lovable-ai-clone/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/lovable-ai-clone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/lovable-ai-clone/discussions)

---

Built with ❤️ using Next.js, E2B, and modern web technologies.
