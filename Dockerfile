FROM node:14.18.1-alpine3.14

ARG USER=node

ENV HOME=/home/${USER}

RUN apk add python3 alpine-sdk \
    && mkdir ${HOME}/app

COPY . "${HOME}/app/"

RUN cd ${HOME}/app \
    && yarn install \
    && npm run build \
    && knex migrate:latest \
    && knex seed:run

WORKDIR ${HOME}/app/

ENTRYPOINT [ "yarn", "start" ]