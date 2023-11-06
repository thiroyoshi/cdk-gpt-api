import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"

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
  return createResponse(BOOKS)
}

/** GET /books/{id} */
export const getBookHandler: APIGatewayProxyHandler = async (event) => {
  console.log(
    "pathParameters = " + JSON.stringify(event.pathParameters, undefined, 2)
  )
  const id = event.pathParameters?.["id"]
  return createResponse(BOOKS.find((b) => b.id === id))
}

/** レスポンスデータを生成する */
function createResponse(body: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  }
}