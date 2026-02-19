# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs

# Go
RUN curl -fsSL https://go.dev/dl/go1.25.5.linux-amd64.tar.gz | tar -C /usr/local -xzf -
ENV PATH="/home/vscode/go/bin:/usr/local/go/bin:${PATH}"

# ユーザーを切り替えて air のインストール
USER vscode
# air の導入
RUN go install github.com/air-verse/air@latest
