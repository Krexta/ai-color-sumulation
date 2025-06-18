FROM node:20.15 AS runner

WORKDIR /work/frontend

ENV NODE_ENV=production

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

COPY ./.next/standalone ./
COPY ./.next/standalone/node_modules ./node_modules
COPY ./.next/static ./.next/static
COPY ./next.config.mjs ./
COPY ./public ./public

# node color-change.mjsで依存があるため、axios/form-dataをコピー
COPY ./package.json ./
# COPY ./node_modules/axios ./node_modules
# COPY ./node_modules/form-data ./node_modules

RUN npm install -g --os=linux --cpu=x64 sharp && \
  mkdir ./.next/cache && \
  mkdir ./.next/cache/images

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]

