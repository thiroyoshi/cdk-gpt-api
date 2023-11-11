import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import axios from 'axios';
import { OpenAI } from "openai";

const KAMATA = {
    latitude: 35.562472067268,
    longitude: 139.71598286456
}

const HANEDA = {
    latitude: 35.5554,
    longitude: 139.7544
}

function getRandom4Int(max: number, min: number): Array<number>  {
    var array = new Array();
    while (array.length < 4) {
        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        if (array.indexOf(random) === -1) {
            array.push(random);
        }
    }
    return array
}

// Get Candidate Places from Google Places API
export const choicesHandler: APIGatewayProxyHandler = async (event) => {
    const PLACES_API_ENDPOINT = process.env.PLACES_API_ENDPOINT || ""
    if (PLACES_API_ENDPOINT == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env PLACES_API_ENDPOINT is null"
            })
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ""
    if (GOOGLE_API_KEY == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env GOOGLE_API_KEY is null"
            })
    }

    var tmpMAX = process.env.PLACES_RESULT_MAX || 20
    if (typeof tmpMAX === 'string') {
        tmpMAX = Number(tmpMAX)
    }
    if (tmpMAX > 20) {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env PLACES_RESULT_MAX needs smaller than 20"
            })
    }
    const PLACES_RESULT_MAX = tmpMAX - 1
    const PLACES_RESULT_MIN = 0
    if (PLACES_RESULT_MIN + 3 > PLACES_RESULT_MAX) {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env PLACES_RESULT_MAX needs larger than 4"
            })
    }

    const bordingTime = event.body? JSON.parse(event.body).bordingTime : null
    if (bordingTime == null) {
        return createResponse(
            400,
            {
                "status": "error",
                "message": "bordingTime is null"
            })
    }

    // Split bordingTime to hour and minute
    const bordingTimeSplit = bordingTime.split(":")
    const bordingTimeHour = bordingTimeSplit[0]
    const bordingTimeMinute = bordingTimeSplit[1]
    const bordingTimeDate = new Date().setHours(bordingTimeHour, bordingTimeMinute, 0, 0)

    // calcurate diff between now and bordingTime
    const now = new Date()
    const diff = bordingTimeDate - now.getTime()

    console.log(bordingTimeDate)
    console.log(now.getTime())
    console.log(now)
    console.log(diff)

    if (diff < 0) {
        return createResponse(
            400,
            {
                "status": "error",
                "message": "bordingTime is past"
            })
    }
    if (diff < 1.5 * 60 * 60 * 1000) {
        return createResponse(
            400,
            {
                "status": "error",
                "message": "Can not recommend because bordingTime is less than 1.5 hours"
            })
    }

    // 3時間未満なら羽田空港を中心に、3時間なら蒲田を中心に
    const center = {
        "latitude": diff < 3 * 60 * 60 * 1000 ? HANEDA.latitude : KAMATA.latitude,
        "longitude": diff < 3 * 60 * 60 * 1000 ? HANEDA.longitude : KAMATA.longitude        
    }

    // Create POST data
    const postData = {
        "includedTypes": ["restaurant","spa"],
        "maxResultCount": PLACES_RESULT_MAX,
        "languageCode": "en",
        "locationRestriction": {
          "circle": {
            "center": center,
            "radius": 1000
          }
        }
      };

    console.log(postData)

    // Create Axios config
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.types'
        },
        timeout: 20000
    };
    
    try {
        // Request to Google Places API
        const response = await axios.post(PLACES_API_ENDPOINT, postData, axiosConfig)
        console.log('Response:', response.data);
        const array = getRandom4Int(PLACES_RESULT_MAX, 0)
        return createResponse(
            200,
            {
                "status": "success",
                "message": {
                    "center" : center,
                    "places" : [
                        response.data.places[array[0]],
                        response.data.places[array[1]],
                        response.data.places[array[2]],
                        response.data.places[array[3]]
                    ]
                }
            })
    } catch(error) {
        console.error('Error:', error);
        return createResponse(
            500,
            {
                "status": "error",
                "message": error
            })
    };

}

// Get Direction from Google Directions API
export const directionHandler: APIGatewayProxyHandler = async (event) => {
    const DIRRECTIONS_API_ENDPOINT = process.env.DIRRECTIONS_API_ENDPOINT || ""
    if (DIRRECTIONS_API_ENDPOINT == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env DIRRECTIONS_API_ENDPOINT is null"
            })
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ""
    if (GOOGLE_API_KEY == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env GOOGLE_API_KEY is null"
            })
    }

    // Get address from query string
    const address = event.queryStringParameters? event.queryStringParameters.address : null
    if( address == null ){
        return createResponse(
            400,
            {
                "status": "error",
                "message": "address is null"
            })
    }

    // Add data to GET request
    const origin = '羽田空港'
    const languageCode = 'en'
    const url = DIRRECTIONS_API_ENDPOINT + '?origin=' + origin + '&destination=' + address + '&travelMode=DRIVING&languageCode=' + languageCode + '&key=' + GOOGLE_API_KEY

    console.log(url)

    // Create Axios config
    const axiosConfig = {
        timeout: 20000,
    };

    try {
        // Request to Google Directions API
        const response = await axios.get(url, axiosConfig)
        console.log('Response:', response.data);
        return createResponse(
            200,
            {
                "status": "success",
                "message": response.data
            })
    } catch(error) {
        console.error('Error:', error);
        return createResponse(
            500,
            {
                "status": "error",
                "message": error
            })
    }

}

// Get natural description about direction from Google Directions API and OpenAI API
export const directionDescriptionHandler: APIGatewayProxyHandler = async (event) => {

    const DIRRECTIONS_API_ENDPOINT = process.env.DIRRECTIONS_API_ENDPOINT || ""
    if (DIRRECTIONS_API_ENDPOINT == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env DIRRECTIONS_API_ENDPOINT is null"
            })
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ""
    if (GOOGLE_API_KEY == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env GOOGLE_API_KEY is null"
            })
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""
    if (OPENAI_API_KEY == "") {
        return createResponse(
            500,
            {
                "status": "error",
                "message": "env OPENAI_API_KEY is null"
            })
    }

    // Get address from query string
    const address = event.queryStringParameters? event.queryStringParameters.address : null
    if( address == null ){
        return createResponse(
            400,
            {
                "status": "error",
                "message": "address is null"
            })
    }

    // Add data to GET request
    const origin = '羽田空港'
    const languageCode = 'en'
    const url = DIRRECTIONS_API_ENDPOINT + '?origin=' + origin + '&destination=' + address + '&travelMode=DRIVING&languageCode=' + languageCode + '&key=' + GOOGLE_API_KEY
    console.log(url)

    // Create Axios config
    const axiosConfig = {
        timeout: 20000,
    };

    try {
        // Request to Google Directions API
        const response = await axios.get(url, axiosConfig)
        console.log('Response:', response.data);

        // Get distance and duration
        const distance = response.data.routes[0].legs[0].distance.text
        const duration = response.data.routes[0].legs[0].duration.text

        // Configure other information
        const playTimeMinute = 60
        const budget = 53.00

        // Create prompt for GPT
        const prompt = `
        You are a travel advisor.
        You make a natural short description using the following information, and recommend it to the customer.

        - address: ${address}
        - distance: ${distance}
        - duration: ${duration}
        - play time: ${playTimeMinute} minutes
        - budget: ${budget} dollars
        `

        // Configure GPT model and temperature
        const model = event.body? JSON.parse(event.body).model : "gpt-3.5-turbo"
        const temperature = event.body? JSON.parse(event.body).temperature : 0.9
      
        // Create OpenAI instance
        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
        });

        // Request to OpenAI API
        const responseGPT = await openai.chat.completions.create(
            {
              model: model,
              messages: [{ role: "system", content: prompt }],
              temperature: temperature,
            }
          );
        console.log(responseGPT.choices[0]);
        return createResponse(
            200,
            {
                "status": "success",
                "message": responseGPT.choices[0]
            })
    } catch(error) {
        console.error('Error:', error);
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