FROM node:14.18.1-alpine3.14

ARG USER=node

ENV HOME=/home/${USER}

RUN apk add python3 alpine-sdk \
    && mkdir ${HOME}/app

COPY . "${HOME}/app/"

RUN npm i -g knex

RUN cd ${HOME}/app \
    && yarn install \
    && npm run build

WORKDIR ${HOME}/app/

ENTRYPOINT [ "yarn", "start" ]
