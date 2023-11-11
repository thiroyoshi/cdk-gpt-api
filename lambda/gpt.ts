import { APIGatewayProxyHandler } from "aws-lambda";
import { OpenAI } from "openai";
import { createResponse } from "./common";

// Get Chat Answer from OpenAI
export const chatHandler: APIGatewayProxyHandler = async (event) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  if (OPENAI_API_KEY == "") {
    return createResponse(500, {
      status: "error",
      message: "env OPENAI_API_KEY is null",
    });
  }

  const model = event.body ? JSON.parse(event.body).model : "gpt-3.5-turbo";
  const prompt = event.body ? JSON.parse(event.body).prompt : null;
  const temperature = event.body ? JSON.parse(event.body).temperature : 0.9;

  if (prompt == null) {
    return createResponse(400, {
      status: "error",
      message: "prompt is null",
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "system", content: prompt }],
      temperature: temperature,
    });
    return createResponse(200, {
      status: "success",
      message: response.choices[0],
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return createResponse(500, {
      status: "error",
      message: error,
    });
  }
};

// Input Image and Get Chat Answer about Information in Image from OpenAI
export const gptImageHandler: APIGatewayProxyHandler = async (event) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  if (OPENAI_API_KEY == "") {
    return createResponse(500, {
      status: "error",
      message: "env OPENAI_API_KEY is null",
    });
  }

  const prompt = event.body ? JSON.parse(event.body).prompt : null;
  if (prompt == null) {
    return createResponse(400, {
      status: "error",
      message: "prompt is null",
    });
  }

  const imageUrl = event.body ? JSON.parse(event.body).imageUrl : null;
  if (imageUrl == null) {
    return createResponse(400, {
      status: "error",
      message: "imageUrl is null",
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (content == null) {
      return createResponse(500, {
        status: "error",
        message: "content is null",
      });
    }

    return createResponse(200, {
      status: "success",
      message: content,
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return createResponse(500, {
      status: "error",
      message: error,
    });
  }
};

// Input Image and Get Chat Answer about Information in BoardingPass Image from OpenAI
export const gptImageBoardingPassHandler: APIGatewayProxyHandler = async (
  event
) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  if (OPENAI_API_KEY == "") {
    return createResponse(500, {
      status: "error",
      message: "env OPENAI_API_KEY is null",
    });
  }

  const imageKey = event.body ? JSON.parse(event.body).imageKey : null;
  if (imageKey == null) {
    return createResponse(400, {
      status: "error",
      message: "imageKey is null",
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    const prompt = `
    extract the boarding informations from the image. output them as following json format.
    return only json format. do not return any other text.
    ---
    {
      "class": "Economy",
      "from": "Tokyo",
      "to": "Osaka",
      "date": "2021-09-01",
      "boardubgTime": "12:00",
      "gate": "A1",
      "flightNumber": "NH1234",
    }
    ---

    if the image is not boarding pass, return error message like following.
    ---
    {
      "error": "this image is not boarding pass."
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url:
                  "https://senbero-image.s3-ap-northeast-1.amazonaws.com/" +
                  imageKey,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (content == null) {
      return createResponse(500, {
        status: "error",
        message: "content is null",
      });
    }

    let result = content.split("{")[1].split("}")[0].replace(/\n/g, "");
    result = "{" + result + "}";

    return createResponse(200, {
      status: "success",
      message: JSON.parse(result),
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return createResponse(500, {
      status: "error",
      message: error,
    });
  }
};
