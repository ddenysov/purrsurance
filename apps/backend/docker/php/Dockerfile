FROM php:fpm-alpine

WORKDIR /var/www/html

# Node 20+ (MCP and frontend tooling); Alpine apk nodejs is often older than package.json engines.
COPY --from=node:20-alpine /usr/local/bin/node /usr/local/bin/node
COPY --from=node:20-alpine /usr/local/lib/node_modules /usr/local/lib/node_modules
# COPY of /usr/local/bin/npm often materializes the symlink target into /usr/local/bin,
# breaking require("../lib/cli.js") inside npm-cli.js. Point bins at npm's real paths.
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY --from=ghcr.io/astral-sh/uv:alpine /usr/local/bin/uv /usr/local/bin/uvx /usr/local/bin/
ENV UV_TOOL_BIN_DIR=/usr/local/bin

RUN apk add --no-cache \
    bash \
    git \
    icu-dev \
    libzip-dev \
    linux-headers \
    oniguruma-dev \
    postgresql-dev \
    unzip \
    zip \
    && docker-php-ext-install \
    bcmath \
    intl \
    pdo_pgsql \
    pgsql \
    zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

CMD ["php-fpm"]
