import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { OpenAI } from "openai";
const openai = new OpenAI({
    apiKey: "OPENAI_API_KEY",
});

const BOOKS = [
  { id: "1", title: "Title-1" },
  { id: "2", title: "Title-2" },
  { id: "3", title: "Title-3" },
]

/** GET /books */
export const getBooksHandler: APIGatewayProxyHandler = async (event) => {
  console.log(
    "pathParameters = " + JSON.stringify(event.pathParameters, undefined, 2)
  )
  return createResponse(200, BOOKS)
}

/** GET /books/{id} */
export const getBookHandler: APIGatewayProxyHandler = async (event) => {
  console.log(
    "pathParameters = " + JSON.stringify(event.pathParameters, undefined, 2)
  )
  const id = event.pathParameters?.["id"]
  return createResponse(200, BOOKS.find((b) => b.id === id))
}

/** POST /chat */
export const chatHandler: APIGatewayProxyHandler = async (event) => {

  console.log(event.body)

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
    const response = await openai.chat.completions.create(
      {
        model: model,
        messages: [{ role: "system", content: prompt }],
        temperature: temperature,
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
      400,
      {
        "status": "error",
        "message": error
      })
  }
}

/** POST /chat-image */
export const chatImageHandler: APIGatewayProxyHandler = async (event) => {
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