# Open Source Automation for BMC Remedy

## Motivation

We're helping our customers to automate their processes since 2005. While most of the time we've done this with properitary tools we had to fight with outdated tools. We've spend a lot of time doing tasks that could be done with todays technology much faster and more efficient.

The goal of this project is to create an state of the art automation solution for BMC Remedy ITSM based on open source technology so everyone can leverage it. We decided to give Node-RED a try.

## Why Node Red

Node-RED is an open source low-code programming tool which UI is completly brower based. It is famous in the IoT / Edge community and therefor very scalable. It has braod user community, regular releases and more than 4.000 plugins / extensions are available for nearly every use case.

## What is the core of ths project

We've created Node-RED plugins that allow you to create, query, update and delete records in Remedy. So all basic CRUD operations are already available. As next step we want to create flexible set of workflows that are based on our best practice and will help you get your automations rolling a lot faster.

## Getting started

First deploy Node-RED & RAPI (our API Gateway) as docker containers. Use the following compose file as a start:

```yaml
version: '3.4' 
services:
  api: 
    image: nodered/node-red
    restart: always
    volumes:
      - data:/data
    networks:
      - traefik-net
      - default
      
  rapi: 
    image: manyos/rapi
    environment: 
      - GRAILS_OPTS=-XX:MaxPermSize=1024m -Xmx4096M -server
    restart: always
    networks:
      - default
      
networks:
  traefik-net:
    external: true
    
volumes:
  data:
    driver: local
    driver_opts:
      type: nfs
      o: nfsvers=4,addr=dockershare,rw
      device: ":/mnt/main/replicated/dockerShares/red-sandbox"

```

Do not forget to secure your installation.

See also https://nodered.org/docs/user-guide/runtime/securing-node-red

Now open Settings -> Manage Palette and install @manyos/node-red-contrib-rapi

![alt text](https://github.com/manyosit/node-red-contrib-rapi/blob/main/palette.png?raw=true)
