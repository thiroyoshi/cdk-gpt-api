import {
  Duration,
    Stack,
    StackProps,
    aws_apigateway as apigateway,
    aws_lambda_nodejs as lambda,
  } from "aws-cdk-lib"
import { Construct } from "constructs"
import * as dotenv from 'dotenv';

  export class LambdaAPIStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props)
  
      // Define evnironment variables
      dotenv.config();
      const lambdaEnv = {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
        PLACES_API_ENDPOINT: process.env.PLACES_API_ENDPOINT || "",
        DIRRECTIONS_API_ENDPOINT: process.env.DIRRECTIONS_API_ENDPOINT || "",
        PLACES_RESULT_MAX: process.env.PLACES_RESULT_MAX || "20",
        TZ: process.env.TZ || "Asia/Tokyo",
      }

      // Create API Gateway (REST API)
      const api = new apigateway.RestApi(this, "GPTMapAPI", {
        deployOptions: {
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      })
      // Create API Key
      const apiKey = api.addApiKey("CdKGptApiKey", {
        apiKeyName: `cdk-gpt-api-key`,
      })
      // Create Usage Plan
      const usagePlan = api.addUsagePlan("CdkGptApiUsagePlan");
      usagePlan.addApiKey(apiKey);
      usagePlan.addApiStage({ stage: api.deploymentStage });

      // Create API Root Path 
      const apiRootGpt = api.root.addResource("gpt")
      const apiRootMaps = api.root.addResource("map")

      // POST gpt/chat/
      const chatHandler = new lambda.NodejsFunction(this, "chatHandler", {
        entry: "lambda/gpt.ts",
        handler: "chatHandler",
        functionName: "chatHandler",
        timeout: Duration.seconds(180),
        environment: lambdaEnv,
      })
      const gptChat = apiRootGpt.addResource("chat")
      gptChat.addMethod("POST", new apigateway.LambdaIntegration(chatHandler), {
        apiKeyRequired: true,
      })

      // POST gpt/image
      const gptImageHandler = new lambda.NodejsFunction(this, "gptImageHandler", {
        entry: "lambda/gpt.ts",
        handler: "gptImageHandler",
        functionName: "gptImageHandler",
        timeout: Duration.seconds(180),
        environment: lambdaEnv,
      })
      const gptImage = apiRootGpt.addResource("image")
      gptImage.addMethod("POST", new apigateway.LambdaIntegration(gptImageHandler), {
        apiKeyRequired: true,
      })

      // POST gpt/image/boardingPass
      const gptImageBoardingPassHandler = new lambda.NodejsFunction(this, "gptImageBoardingPassHandler", {
        entry: "lambda/gpt.ts",
        handler: "gptImageBoardingPassHandler",
        functionName: "gptImageBoardingPassHandler",
        timeout: Duration.seconds(180),
        environment: lambdaEnv,
      })
      const gptImageBoardingPass = gptImage.addResource("boardingPass")
      gptImageBoardingPass.addMethod("POST", new apigateway.LambdaIntegration(gptImageBoardingPassHandler), {
        apiKeyRequired: true,
      })

      // POST map/choices
      const mapChoicesHandler = new lambda.NodejsFunction(this, "mapChoicesHandler", {
        entry: "lambda/map.ts",
        handler: "choicesHandler",
        functionName: "choicesHandler",
        timeout: Duration.seconds(30),
        environment: lambdaEnv,
      })
      const mapChoices = apiRootMaps.addResource("choices")
      mapChoices.addMethod("POST", new apigateway.LambdaIntegration(mapChoicesHandler), {
        apiKeyRequired: true,
      })

      // GET map/directions
      const getMapDirectionsHandler = new lambda.NodejsFunction(this, "mapDirectionsHandler", {
        entry: "lambda/map.ts",
        handler: "directionHandler",
        functionName: "directionHandler",
        timeout: Duration.seconds(180),
        environment: lambdaEnv,
      })
      const mapDirections = apiRootMaps.addResource("directions")
      mapDirections.addMethod("GET", new apigateway.LambdaIntegration(getMapDirectionsHandler), {
        apiKeyRequired: true,
      })

      // GET map/directions/description
      const getDirectionDescriptionHandler = new lambda.NodejsFunction(this, "mapDirectionDescriptionHandler", {
        entry: "lambda/map.ts",
        handler: "directionDescriptionHandler",
        functionName: "directionDescriptionHandler",
        timeout: Duration.seconds(180),
        environment: lambdaEnv,
      })
      const mapDirectionsChat = mapDirections.addResource("description")
      mapDirectionsChat.addMethod("GET", new apigateway.LambdaIntegration(getDirectionDescriptionHandler), {
        apiKeyRequired: true,
      })

    }
  }