const https = require('https');
const consts = {
    communityWallet: '0x09D1B342c28e27D37aAAE0E6380a3741bE188828',
    checkBalance: `/v1/56/address/{1}/balances_v2/?key=ckey_79118b0cef99433985bf5c4585c`,
    getHashData: `/v1/56/transaction_v2/{1}/?key=ckey_79118b0cef99433985bf5c4585c`
}

exports.initiateTatankaBotClient = () => {
    const getBalance = address => {
        const options = {
            hostname: 'api.covalenthq.com',
            port: 443,
            path: consts.checkBalance.replace('{1}', address),
            method: 'GET'
        }
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                res.setEncoding('utf8');
                let allRes = '';
                res.on('data', chunk => {
                    allRes += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(allRes));
                    } else {
                        reject('Invalid wallet address, or network timeout.\nPlease try again in a few minutes');
                    }
                });
            });
            req.on('error', error => {
                reject();
            });
            req.end();
        });          
    } 
    return {
        tataValue: 0,
       getCommunityBalance: () => {
            return getBalance(consts.communityWallet);
        },
        getAddressBalance: addr => {
            return getBalance(addr);
        },
        getAllWallets: () => {
            const options = {
                hostname: 'api.covalenthq.com',
                port: 443,
                path: '/v1/56/tokens/0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf/token_holders/?key=ckey_79118b0cef99433985bf5c4585c&page-size=1000',
                method: 'GET'
            }
            return new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    res.setEncoding('utf8');
                    let allRes = '';
                    res.on('data', chunk => {
                        allRes += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(allRes).data.items);
                        } else {
                            reject('Invalid TxID');
                        }
                    });
                });
                req.on('error', error => {
                    reject();
                });
                req.end();
            });
        },
        getHashData: addr => {
            const options = {
                hostname: 'api.covalenthq.com',
                port: 443,
                path: consts.getHashData.replace('{1}', addr),
                method: 'GET'
            }
            return new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    res.setEncoding('utf8');
                    let allRes = '';
                    res.on('data', chunk => {
                        allRes += chunk;
                    });
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(allRes));
                        } else {
                            reject('Invalid TxID');
                        }
                    });
                });
                req.on('error', error => {
                    reject();
                });
                req.end();
            });          
        }
    }
}