import { APIGatewayProxyResult } from "aws-lambda";

type ResponseBody = {
  status: string;
  message: string | unknown;
};

export function createResponse(
  code: number,
  body: ResponseBody
): APIGatewayProxyResult {
  return {
    statusCode: code ? code : 200,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
}
