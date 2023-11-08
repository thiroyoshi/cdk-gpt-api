import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { OpenAI } from "openai";

// Get Chat Answer from OpenAI
export const chatHandler: APIGatewayProxyHandler = async (event) => {

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""
  if (OPENAI_API_KEY == "") {
      return createResponse(
          500,
          {
              "status": "error",
              "message": "env OPENAI_API_KEY is null"
          })
  }

  const model = event.body? JSON.parse(event.body).model : "gpt-3.5-turbo"
  const prompt = event.body? JSON.parse(event.body).prompt : null
  const temperature = event.body? JSON.parse(event.body).temperature : 0.9

  if ( prompt == null ){
    return createResponse(
      400,
      {
        "status": "error",
        "message": "prompt is null"
      })
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create(
      {
        model: model,
        messages: [{ role: "system", content: prompt }],
        temperature: temperature,
      }
    );
    return createResponse(
      200,
      {
        "status": "success",
        "message": response.choices[0]
      })
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return createResponse(
      500,
      {
        "status": "error",
        "message": error
      })
  }
}

// Input Image and Get Chat Answer about Information in Image from OpenAI
export const chatImageHandler: APIGatewayProxyHandler = async (event) => {

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""
  if (OPENAI_API_KEY == "") {
      return createResponse(
          500,
          {
              "status": "error",
              "message": "env OPENAI_API_KEY is null"
          })
  }
  
  // const imageKey = event.body? JSON.parse(event.body).imageId : null
  
  // if ( imageKey == null ){
  //   return createResponse(
  //     400,
  //     {
  //       "message": "imageKey is null"
  //     })
  // }
  const imageKey = "ticket.jpg"

  // S3バケットから画像データを取得する
  // const params = {
  //   Bucket: "senbero-image",
  //   Key: imageKey,
  // };
  // const s3 = new AWS.S3();
  // const data = await s3.getObject(params).promise();

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      }
    );
    console.log(response.choices[0]);
    return createResponse(
      200,
      {
        "status": "success",
        "message": response.choices[0]
      })
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return createResponse(
      500,
      {
        "status": "error",
        "message": error
      })
  }

}

/** レスポンスデータを生成する */
function createResponse(code: number, body: any): APIGatewayProxyResult {
  return {
    statusCode: code ? code : 200,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  }
}