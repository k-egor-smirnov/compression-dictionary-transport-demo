FROM oven/bun:debian
COPY . .
RUN apt-get update && apt-get install -y \
zstd \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*
RUN bun install
CMD ["bun", "start"]
EXPOSE 443
