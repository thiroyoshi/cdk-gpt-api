# cdk-gpt-api

## Description

This is the REST API set using OpenAI API and Google Map API
You can build the following APIs

- Chat GPT
- Visual Input to GPT (using S3 as storage)
  - extract flight informations on a boarding ticket
- Find restaulant or spa around Kamata Station or Haneda Station
- Describe how to go to the Place you want to go

## Requirements
- node.js
- TypeScript
- [AWS CLI](https://aws.amazon.com/jp/cli/)
- [AWS CDK](https://aws.amazon.com/jp/cdk/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Google Map Platform](https://developers.google.com/maps?hl=ja)

## How to Deploy

- Get AWS Access Key and Secret Access Key
- Install AWS CLI and AWS CDK and configure credentials(Access Key and Secret Access Key)
- Get API Key of OpenAI API and pay some money
- Get API Key of Google Map Platform
- Install node modules
```
npm install
```
- Create `.env` file like below and set API Keys you got (you can use `.env.sample`)
```
OPENAI_API_KEY=sk-XXXXXXX
GOOGLE_API_KEY=XXXXXXX
PLACES_API_ENDPOINT=https://places.googleapis.com/v1/places:searchNearby
DIRRECTIONS_API_ENDPOINT=https://maps.googleapis.com/maps/api/directions/json
PLACES_RESULT_MAX=20
```
- Execute CDK command
```
cdk deploy --all
```
