// CDK V2 系のインポート（追加インストールの必要なし）
import {
  Duration,
    Stack,
    StackProps,
    aws_apigateway as apigateway,
    aws_lambda_nodejs as lambda,
  } from "aws-cdk-lib"
import { Construct } from "constructs"
  
  export class LambdaAPIStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props)
  
      // Lambda 関数（GET books/ 用）
      const getBooksHandler = new lambda.NodejsFunction(this, "getBooksHandler", {
        entry: "lambda/books.ts",
        handler: "getBooksHandler",
        functionName: "getBooksHandler",
      })
  
      // Lambda 関数（GET books/{id} 用）
      const getBookHandler = new lambda.NodejsFunction(this, "getBookHandler", {
        entry: "lambda/books.ts",
        handler: "getBookHandler",
        functionName: "getBookWithIdHandler",
      })

      // Lambda 関数（POST chat/ 用）
      const chatHandler = new lambda.NodejsFunction(this, "chatHandler", {
        entry: "lambda/gpt.ts",
        handler: "chatHandler",
        functionName: "chatHandler",
        timeout: Duration.seconds(180),
      })

      // Lambda 関数（POST chat-image/ 用）
      const chatImageHandler = new lambda.NodejsFunction(this, "chatImageHandler", {
        entry: "lambda/gpt.ts",
        handler: "chatImageHandler",
        functionName: "chatImageHandler",
        timeout: Duration.seconds(180),
      })

      // Lambda 関数（POST map/choices 用）
      const mapChoicesHandler = new lambda.NodejsFunction(this, "mapChoicesHandler", {
        entry: "lambda/map.ts",
        handler: "choicesHandler",
        functionName: "choicesHandler",
        timeout: Duration.seconds(30),
      })
  
      // Lamda 関数（GET directions/ 用）
      const getDirectionsHandler = new lambda.NodejsFunction(this, "mapDirectionsHandler", {
        entry: "lambda/map.ts",
        handler: "directionHandler",
        functionName: "directionHandler",
        timeout: Duration.seconds(180),
      })

      // API Gateway (REST API) の作成
      const api = new apigateway.RestApi(this, "SenBeroAPI")
  
      // リソースを定義して Lambda プロキシ統合 (GET books/)
      const books = api.root.addResource("books")
      books.addMethod("GET", new apigateway.LambdaIntegration(getBooksHandler))
  
      // リソースを定義して Lambda プロキシ統合 (GET book/)
      const singleBook = books.addResource("{id}")
      singleBook.addMethod("GET", new apigateway.LambdaIntegration(getBookHandler))

      // リソースを定義して Lambda プロキシ統合 (POST chat/)
      const chat = api.root.addResource("chat")
      chat.addMethod("POST", new apigateway.LambdaIntegration(chatHandler))

      // リソースを定義して Lambda プロキシ統合 (POST chat-image/)
      const chatImage = api.root.addResource("chat-image")
      chatImage.addMethod("POST", new apigateway.LambdaIntegration(chatImageHandler))

      // リソースを定義して Lambda プロキシ統合 (POST map/choices)
      const maps = api.root.addResource("map")
      const mapChoices = maps.addResource("choices")
      mapChoices.addMethod("POST", new apigateway.LambdaIntegration(mapChoicesHandler))

      // リソースを定義して Lambda プロキシ統合 (GET map/directions/)
      const directions = maps.addResource("directions")
      directions.addMethod("GET", new apigateway.LambdaIntegration(getDirectionsHandler))

    }
  }