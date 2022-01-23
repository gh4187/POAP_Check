const fs = require('fs')
const request = require("request");
const dotenv = require(`dotenv`);
dotenv.config();

var claim_url = 'https://frontend.poap.tech/actions/claim-qr';

// 同步请求方法
let synchronous_request = function (url, params) {
    let options = {
        url: url,
        form: params,
        headers:{
            "google-token": process.env.google_token
        }
    }
    if (params == undefined) {
        return new Promise(function (resolve, reject) {
            request.get(options, function (error, response, body) {
            // requestProxy.get(options, function (error, response, body) {
                if (error) {
                    reject(error)
                } else {
                    resolve(body)
                }
            })
        })
    } else {
        return new Promise(function (resolve, reject) {
            request({
                url: url,
                method: "POST",
                json: true,
                headers: {
                    "content-type": "application/json"
                },
                body: params
            }, function(error, response, body) {
                // console.log(body);
                if(body.statusCode == 400){
                    console.log("领取失败:" + params.address + "----" + body.message + "----; 此code还可用：" + params.qr_hash + "\n")
                    fs.appendFileSync("cliam.txt", "https://POAP.xyz/claim/"+params.qr_hash +"\n");
                }else{
                    console.log("领取成功:" + params.address + "\n")
                }
                if (error) {
                    reject(error)
                } else {
                    resolve(body)
                }
            });
        })
    }
}


async function main() {
    try {
        //读取txt里的url
        let list = fs.readFileSync('qr_list.txt')
        let lines = list.toString().split('\n')
        for (let index in lines) {
            let line = lines[index]
            let a = line.split('/')
            let qr_hash = a[a.length - 1]
            let url = claim_url + '?qr_hash=' + qr_hash
            let body = await synchronous_request(url)
            console.log("检查响应:"+body)
            if (body.toString().search("authorized") != -1){
                console.log("**************权限失效 替换一下google_token***************");
                break;
            }
            let o = JSON.parse(body)
            // console.log("o.claimed:"+o.claimed)
            if(o.claimed == false){
                console.log("*****************************快,这个还能claim："+ line + "\n")
                fs.appendFileSync("cliam.txt", line+"\n");
            }else{
                console.log("*****************************手慢了xd,这个已被claim了："+ line +"\n")
            }
        }
    }catch (e) {
        console.log("错误：" + e)
        fs.appendFileSync("error.txt", e);
    }
    console.log("***************结束 15秒后自动退出 **************")
    setTimeout(() => {process.exit()},15000);
}

main()

