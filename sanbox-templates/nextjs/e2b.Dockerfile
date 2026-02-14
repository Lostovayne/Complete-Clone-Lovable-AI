# You can use most Debian-based base images
FROM node:22-slim

# Install curl and dos2unix to fix line endings
RUN apt-get update && apt-get install -y curl dos2unix && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy and fix line endings for the compile script
COPY compile_page.sh /compile_page.sh
RUN dos2unix /compile_page.sh && chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user

# Create Next.js app with TypeScript and Tailwind
RUN npx --yes create-next-app@latest nextjs-app --typescript --tailwind --app --no-src-dir --import-alias "@/*" --turbopack --yes

# Install shadcn/ui
WORKDIR /home/user/nextjs-app
RUN npx --yes shadcn@latest init --yes --defaults
RUN npx --yes shadcn@latest add --all --yes

# Move the Next.js app to the home directory
WORKDIR /home/user
RUN cp -r /home/user/nextjs-app/* /home/user/ && \
    cp -r /home/user/nextjs-app/.* /home/user/ 2>/dev/null || true && \
    rm -rf /home/user/nextjs-app
