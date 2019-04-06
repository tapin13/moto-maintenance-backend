const request = require('request');


setInterval(() => {
    request.get("http://moto-moto.1d35.starter-us-east-1.openshiftapps.com/", {
    // headers: {
    //     'Accept': 'text/html,application/xhtml+xml;q=0.9,image/webp,*/*;q=0.8',
    //     'Accept-Encoding': 'gzip, deflate',
    //     'Accept-Language': 'he,ru-MD;q=0.8,en-US;q=0.5,en;q=0.3',
    //     'Connection': 'keep-alive',
    //     'DNT': '1',
    //     'Host': 'moto-moto.1d35.starter-us-east-1.openshiftapps.com',
    //     'Upgrade-Insecure-Requests': '1',
    //     'User-Agent': 'Mozilla'
    //   }
}, (error, res, body) => {
  if (error) {
    console.error(error)
    return
  }
  console.log(`statusCode: ${res.statusCode}`)
  console.log(body)
})
}, 1000);

