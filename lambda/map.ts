import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import axios from 'axios';
import { OpenAI } from "openai";
const openai = new OpenAI({
    apiKey: "OPENAI_API_KEY",
});

const PLACES_API_ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby'
const DIRRECTIONS_API_ENDPOINT = 'https://maps.googleapis.com/maps/api/directions/json'
const GOOGLE_API_KEY = 'GOOGLE_API_KEY'
const MAX_RESULT_COUNT = 20

function getRandome4Int () {
    const min = 0;
    const max = MAX_RESULT_COUNT - 1;
    var array = new Array();
    while (array.length < 4) {
        var random = Math.floor(Math.random() * (max - min + 1)) + min;
        if (array.indexOf(random) === -1) {
            array.push(random);
        }
    }
    return array
}

export const choicesHandler: APIGatewayProxyHandler = async (event) => {
    const bordingTime = event.body? JSON.parse(event.body).bordingTime : null
    if( bordingTime == null ){
        return createResponse(
            400,
            {
                "status": "error",
                "message": "bordingTime is null"
            })
    }

    // 時と分に分割
    const bordingTimeSplit = bordingTime.split(":")
    const bordingTimeHour = bordingTimeSplit[0]
    const bordingTimeMinute = bordingTimeSplit[1]
    const bordingTimeDate = new Date().setHours(bordingTimeHour, bordingTimeMinute, 0, 0)

    // boardingTimeと現在時刻から、行けそうな距離を計算する（できてない）
    const now = new Date()
    const diff = bordingTimeDate - now.getTime()

    console.log(bordingTimeDate)
    console.log(now.getTime())
    console.log(diff)
    
    // 3時間未満なら、羽田空港を中心に1000m圏内
    if (diff < 3 * 60 * 60 * 1000) {
        var lat = 35.562472067268
        var lng = 139.71598286456
        var radius = 1000
    }
    // 3時間なら、蒲田を中心に1000m圏内
    else {
        var lat = 35.562472067268
        var lng = 139.71598286456
        var radius = 1000
    }

    // POSTリクエストのデータ
    const postData = {
        "includedTypes": ["restaurant","spa"],
        "maxResultCount": MAX_RESULT_COUNT,
        "languageCode": "en",
        "locationRestriction": {
          "circle": {
            "center": {
              "latitude": lat,
              "longitude": lng
              },
            "radius": radius
          }
        }
      };
    
    // Axiosリクエストの設定
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.types'
        },
        timeout: 20000
    };
    
    // POSTリクエストの実行
    try {
        const response = await axios.post(PLACES_API_ENDPOINT, postData, axiosConfig)
        console.log('Response:', response.data);
        const array = getRandome4Int()
        return createResponse(
            200,
            {
                "status": "success",
                "message": [
                    response.data.places[array[0]],
                    response.data.places[array[1]],
                    response.data.places[array[2]],
                    response.data.places[array[3]]
                ]
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

export const directionHandler: APIGatewayProxyHandler = async (event) => {
    const address = event.queryStringParameters? event.queryStringParameters.address : null
    if( address == null ){
        return createResponse(
            400,
            {
                "status": "error",
                "message": "address is null"
            })
    }

    // GETリクエストのデータを追加
    const origin = '羽田空港'
    const languageCode = 'en'
    const url = DIRRECTIONS_API_ENDPOINT + '?origin=' + origin + '&destination=' + address + '&travelMode=DRIVING&languageCode=' + languageCode + '&key=' + GOOGLE_API_KEY

    console.log(url)

    // Axiosリクエストの設定
    const axiosConfig = {
        timeout: 20000,
    };

    // GETリクエストの実行
    try {
        const response = await axios.get(url, axiosConfig)
        console.log('Response:', response.data);

        // 運転の時間を取得
        const distance = response.data.routes[0].legs[0].distance.text
        const duration = response.data.routes[0].legs[0].duration.text

        // 滞在時間を設定
        const playTimeMinute = 60

        // プロンプトを作成
        const prompt = `
        You are a travel advisor.
        You make a natural short description using the following information, and recommend it to the customer.

        - address: ${address}
        - distance: ${distance}
        - duration: ${duration}
        - play time: ${playTimeMinute} minutes
        - budget: $53

        `
        const model = event.body? JSON.parse(event.body).model : "gpt-4"
        const temperature = event.body? JSON.parse(event.body).temperature : 0.9
      
        // GPTにリクエスト
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