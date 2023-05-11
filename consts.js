exports.tenAmendments = `עשרת הדיברות של מסחר נכון: 
1. האיתותים אינם המלצות, אנו לא יועצים פיננסים. כל האיתותים זה מה שאני עושה, יכולים לעקוב או שלא, על אחריותכם.
2. תנהלו נכון את הטרייד. אל תמנפו בטירוף (5-10 זה סבבה) ואל תכניסו יותר מדי כסף לכל טרייד (2-5% מהחשבון זה מעולה). {}
3. אל תהיו גרידים (חמדנים) . רואים רווח נאה שסבבה לכם, סגרו את הטרייד גם אם לא הגיע ליעד. קחו רווחים! המטבע עלול ליפול, תזכרו תמיד.
4. מרוויחים בכפית ומפסידים בדליים.. הרווחים קטנים והרבה, ההפסדים בודדים אבל כואבים, תזכרו את זה.
4. לא לשגע אותנו ב "האם הטרייד עוד רלוונטי". כלל האצבע הוא שאם עוד לא הגענו ליעד ראשון הוא עוד רלוונטי. 
5. לא לשגע אותנו אם נכנסים למינוס. רוב הטריידים עוברים במינוס לפני פלוס. יש סטופלוס. לא פגע לא לברוח. תנשמו עמוק ונתקו רגש. קשה? תתרחקו מביננס.
6. אל תסכנו מה שאתם לא יכולים להפסיד. זה משחק מסוכן מאוד, אפשר לעשות ארגזים ואפשר להפסיד הכל.
7. תשתמשו בבוט! הוא ינהל לכם את הטרייד ללא רגש, בדיוק מה שצריך.
8. לא לשאול בפרטי אלא בקבוצה, אולי מישהו יענה לפני, אולי יש את אותה בעיה או שאלה לעוד מישהו. אתם הרבה אני אחד, סבלנות, תשובה עלולה גם להתעכב. 
9. דברו בכבוד ובסובלנות. מי שינג׳ס או ידבר לא יפה יעוף ויושהה ליום לתקופת צינון. פעם שניה יהיה לצמיתות.
10. תהנו. אם כל זה גורם לכם לסטרס לכו הצידה, תעשו הפסקה ותחזרו. לוקח זמן לנתק רגש, וזה טבעי. קשה לכם מדי תתחילו בקטן (100-300 דולר) ותצמחו משם. אם גם זה קשה רגשית - כנראה אתם לא במקום הנכון.

לשאלות יכולים לתייג אותי בקבוצה https://t.me/CryptoBeast_IL @crypto_beast`;

exports.tutorialsKeyboard = {
    reply_markup: {
        "inline_keyboard": [
            [
                {
                    text: "קישור לערוץ ההדרכות",
                    url: "https://t.me/CryptoBeast_Tutorials"
                }
            ],
            [
                {
                    text: "עשרת הדיברות למסחר נכון",
                    callback_data: `bible`
                }
            ],
            [
                {
                    text: "הדרכת קורניקס",
                    url: "https://youtu.be/nNy9XERllaQ"
                },
                {
                    text: "קישור לרישום לבוט",
                    url: "https://t.me/cornix_trading_bot?start=ref-b2a80e99b40940ff9d007228a387c7ca"
                }
            ],
            [
                {
                    text: "מסחר בפיוצ׳רס",
                    url: "https://youtu.be/JVjqfCbHfMY"
                },
                {
                    text: "מסחר בספוט",
                    url: "https://youtu.be/m5-0M721f4E"
                },
                {
                    text: "טריילינג סטופ",
                    url: "https://youtu.be/qr6K0k8uiog"
                }
            ],
            [
                {
                    text: "ניהול איתותים במחשב",
                    url: "https://youtu.be/wrfBHIn2zQs"
                },
                {
                    text: "ניהול איתותים בנייד",
                    url: "https://youtu.be/rsxEgXJ41b4"
                }
            ],
            [
                {
                    text: "קהילת TATA",
                    url: "https://t.me/tatankacoin"
                },
                {
                    text: "איך קונים TATA",
                    url: "https://www.youtube.com/watch?v=v5DChwN05CI&ab_channel=CryptoBeastSignals"
                }
            ],
        ]
    }
}
exports.hop = [
    'הופ הופ הופ',
    'אפ אפ אפ',
    '${1} תעלה'
]

exports.hopEng = [
    'Hop Hop Hop',
    'Up Up Up',
    '${1} To the Mooon'
]

exports.drop = [
    'דרופ דרופ דרופ',
    'דאון דאון דאון',
    '${1} תתרסק'
]

exports.closeRow = [
    {
        text: "Close",
        callback_data: JSON.stringify({ type: '::close' })
    }
]

exports.defaultValues = {
    take: 2,
    sl: 3,
    numTargets: 4,
    leverage: 10
}

exports.blockingValues = {
    take: 1,
    sl: 5,
    numTargets: 3,
    leverage: 10
}

exports.immigrationFetchOptions = {
    LocationSearch: {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "he",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjRyQTdaXzJOWTRRaDFHenVkc2ZsZ0hlUFczdyJ9.eyJpc3MiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJhdWQiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJuYmYiOjE2NTIyNjkwNjMsImV4cCI6MTY1MjI2OTk2MywidW5pcXVlX25hbWUiOiJkZmNhNWZhNC0wYTQ2LTQ3MDQtOGQxMC04ZmI3ZWVmOTYwM2UifQ.dKmZ0eAPk1nsCEZdoFamvyAZ39Hk58woB-uo5xOK2il73z2CXR5pIOMMMk9hdDedFIrZxX0GOtcNhIf2LgLlIoEfkJ_UCN4MXGnD0k_tu6NMdLeFhPMurz6AvcV0wBrlErwg4I7tBQPFStvl1nXfBUnTFFyZTuKAI0YNHZXslK8_b-wFTHjhOO0mz-Whns3eLBoVSk611SGOJQ8lkwFG6XI5RNwss39jCPAvM_B8K2XM-2Iuj1iXDvQ7Csg_6nSWFYAcdH68g0yqvw-pHvPyFlkN6pfZGjGzg8GxBC6uekfvqc5NtNNMRvn0SOVOQuuUHJdHj9TNvT7HAZyDaMpIBQ",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "cookie": "ARRAffinitySameSite=1405d982b4a15efe34b44fcc99eada29e06b00e246255a873dd8b91fc472b07c",
            "Referer": "https://myvisit.com/",
            "Referrer-Policy": "no-referrer-when-downgrade"
        },
        "body": null,
        "method": "GET"
    },
    LocationGetServices: {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "he",
            "application-api-key": "8df143c7-fd10-460e-bcc0-d0c1cf947699",
            "application-name": "myVisit.com v4.0",
            "authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6InljeDFyWFRmalRjQjZIQWV1aGxWQklZZmZUbyJ9.eyJpc3MiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJhdWQiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJuYmYiOjE2NTE5ODk1NDUsImV4cCI6MTY4MzA5MzU0NSwidW5pcXVlX25hbWUiOiJkZmNhNWZhNC0wYTQ2LTQ3MDQtOGQxMC04ZmI3ZWVmOTYwM2UifQ.mlaz1CnJq_rj2OJSKEAw606z8NhXYx-F0zM7ntn8LVcE6MH7QZMkDTEiUwDtHBwkHeYT3dFjBs2nf2Izv4kK3ylpYrlOl16f_Pc1zuFfIizh6M3douYX6mYqlV-ivcIW7rnc-jKg2EmVK-MHW2BjK2dX8fFNaqFChXmiMT8QpXxZ532cNV4gnHAcJLG7ozlLBJSfD6o9rXZ-J8aikYzeD61e1eX2IkHQLFdM5h-i2DSxDNrBRnoOu8dgIJzAyLXQUryvxzsF4F-W5UQFi1Kk2dBshCzx7vG7NExruj8t8-UBw-FXcys04JTgd1jKyF40Z5nRe6gjbzm_y2FbsEqaOg",
            "preparedvisittoken": "9fb46bbf-3211-4c54-a6c8-2297d549cb41",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    },
    SearchAvailableDates: {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjRyQTdaXzJOWTRRaDFHenVkc2ZsZ0hlUFczdyJ9.eyJpc3MiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJhdWQiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJuYmYiOjE2NTIzNjA5MjMsImV4cCI6MTY1MjM2MjcyMywidW5pcXVlX25hbWUiOiJkZmNhNWZhNC0wYTQ2LTQ3MDQtOGQxMC04ZmI3ZWVmOTYwM2UifQ.ugCgd-Sf7OaVqOscLKOKXd9nA2KcXBe7zGwkO6otUTXBm95RTgr6FbQGNSfuIPcEUbDyJD0xWwdqHc6nw3rIDw8xBj4Qcj9FSvJ9CxtN0_7lUKpT2vA5vUNNFQYSSf7s8X1FZ3KaLWTSBx9fVEIqCQAfjzkgQRMKouGGCCN5tvqHrphs4zHQeXr-aSMwqS1jgbAODeNpBG2pKgAXliNBNKrU9b9ujksYtCqjbwrZok3aeCYVyLn7AglHIEOMaqDydHVBSl3aeGTn_FOWaIWr4doGY5o02-kKV3YBGD6byDL6Jaie5EP43QADxcw_B1OOb2ebMoCOW0l3Z4kygfVSHA",
            "preparedvisittoken": "cd38065f-6db7-42d3-a96e-ef64d68021f7",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "cookie": "ARRAffinitySameSite=1405d982b4a15efe34b44fcc99eada29e06b00e246255a873dd8b91fc472b07c",
            "Referer": "https://myvisit.com/",
            "Referrer-Policy": "no-referrer-when-downgrade"
        },
        "body": null,
        "method": "GET"
    },
    SearchAvailableSlots: {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "authorization": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjRyQTdaXzJOWTRRaDFHenVkc2ZsZ0hlUFczdyJ9.eyJpc3MiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJhdWQiOiJodHRwOi8vY2VudHJhbC5xbm9teS5jb20iLCJuYmYiOjE2NTIzNjA5MjMsImV4cCI6MTY1MjM2MjcyMywidW5pcXVlX25hbWUiOiJkZmNhNWZhNC0wYTQ2LTQ3MDQtOGQxMC04ZmI3ZWVmOTYwM2UifQ.ugCgd-Sf7OaVqOscLKOKXd9nA2KcXBe7zGwkO6otUTXBm95RTgr6FbQGNSfuIPcEUbDyJD0xWwdqHc6nw3rIDw8xBj4Qcj9FSvJ9CxtN0_7lUKpT2vA5vUNNFQYSSf7s8X1FZ3KaLWTSBx9fVEIqCQAfjzkgQRMKouGGCCN5tvqHrphs4zHQeXr-aSMwqS1jgbAODeNpBG2pKgAXliNBNKrU9b9ujksYtCqjbwrZok3aeCYVyLn7AglHIEOMaqDydHVBSl3aeGTn_FOWaIWr4doGY5o02-kKV3YBGD6byDL6Jaie5EP43QADxcw_B1OOb2ebMoCOW0l3Z4kygfVSHA",
            "preparedvisittoken": "cd38065f-6db7-42d3-a96e-ef64d68021f7",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "cookie": "ARRAffinitySameSite=1405d982b4a15efe34b44fcc99eada29e06b00e246255a873dd8b91fc472b07c",
            "Referer": "https://myvisit.com/",
            "Referrer-Policy": "no-referrer-when-downgrade"
        },
        "body": null,
        "method": "GET"
    }
}
exports.TATAContract = '0xe3bb0eb9107ae85540c2f4a5d9385f04d2c602c4';
exports.tatankaKeyboard = {
    reply_markup: {
        "inline_keyboard": [
            [
                {
                    text: "Info",
                    callback_data: 'info'
                },
                {
                    text: "Community Balance",
                    callback_data: 'balance'
                }
            ],
            [
                {
                    text: "Buy",
                    url: "https://pancakeswap.finance/swap?outputCurrency=0xe3bb0eb9107ae85540c2f4a5d9385f04d2c602c4"
                },
                {
                    text: "Chart",
                    url: "https://poocoin.app/tokens/0xe3bb0eb9107ae85540c2f4a5d9385f04d2c602c4"
                }
            ],
            [
                {
                    text: "Buying tutorial - Step by step",
                    url: "https://www.youtube.com/watch?v=v5DChwN05CI&ab_channel=CryptoBeastSignals"
                }
            ]
        ]
    }
}

