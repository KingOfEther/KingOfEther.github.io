class KingOfEtherService {
    constructor(web3, contract, account) {
        this.web3 = web3
        this.account = account
        this.contract = contract
        this.becomeRichestHex = this.contract.methods.becomeRichest().encodeABI()
    }

    async history() {
        const key = '7D74BSWRSX3HGI7WJMD18V24D3WFH7HR5K'
        const url = `https://ropsten.etherscan.io/api?module=account&action=txlist&address=${this.contract.options.address}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`
        const response = await fetch(url)
        const json = await response.json()
        const transactions = await Promise.all(json.result.map(async tx => {
            const txData = await this.web3.eth.getTransaction(tx.hash)
            return {
                hash: txData.hash,
                data: txData.input,
                from: txData.from,
                to: txData.to,
                value: txData.value,
                date: new Date(parseInt(tx.timeStamp) * 1000)
            }
        }))
        const filtered = transactions.filter(tx => tx.data == this.becomeRichestHex)
        filtered.sort((tx1, tx2) => {
            return tx2.date - tx1.date
        })
        return filtered
    }

    async becomeRichest(weiValue, onHash) {
        const tx = {
            data: this.becomeRichestHex,
            from: this.account.address,
            to: this.contract.options.address,
            gas: 2000000,
            value: weiValue
        }
        const signedTx = await this.account.signTransaction(tx)
        return this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .once('transactionHash', hash => {
                if (onHash) {
                    onHash(hash)
                }
            })
    }

    async status() {
        const obj = {
            'richest': await this.contract.methods.richest().call(),
            'ramainingTime': await this.contract.methods.remainingTime().call(),
            'mostSent': await this.contract.methods.mostSent().call()
        }
        obj['canStartGame'] = obj['ramainingTime'] == 0
        return obj
    }
}

window.onload = () => {
    const infuraUrl = 'wss://ropsten.infura.io/ws/v3/b725b07e9e3c4a5296ff87bd4feb0abc'
    const contractAddress = '0x40fe0d0Cc856Bd801a063E5a3054455e7BFdAF32'
    const contractAbi = [{"inputs":[{"internalType":"uint256","name":"_gameDuration","type":"uint256"},{"internalType":"uint256","name":"_startingValue","type":"uint256"},{"internalType":"uint256","name":"_increasePercentage","type":"uint256"},{"internalType":"uint256","name":"_transactionFeePercentage","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"king","type":"address"},{"indexed":false,"internalType":"uint256","name":"money","type":"uint256"}],"name":"NewKing","type":"event"},{"inputs":[],"name":"amountWithdrawable","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"becomeRichest","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"gameDuration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increasePercentage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mostSent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingTime","outputs":[{"internalType":"uint256","name":"time","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"richest","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startingValue","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    const etherscan = `https://ropsten.etherscan.io/address/${contractAddress}`

    const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraUrl))
    const contract = new web3.eth.Contract(contractAbi, contractAddress)
    const service = new KingOfEtherService(web3, contract, null)

    document.getElementById('contractAddress').innerText = contractAddress
    document.getElementById('hexData').innerText = service.becomeRichestHex
    document.getElementById('etherscan').onclick = () => window.open(etherscan, '_blank')

    service.history()
        .then(history => {
            const table = document.getElementById('history')
            history.forEach(tx => {
                const eth = web3.utils.fromWei(tx.value, 'ether')
                const tr = document.createElement('tr')
                const date = document.createElement('td')
                const from = document.createElement('td')
                const value = document.createElement('td')
                const dateString = `${
                    (tx.date.getMonth()+1).toString().padStart(2, '0')}/${
                    tx.date.getDate().toString().padStart(2, '0')}/${
                    tx.date.getFullYear().toString().padStart(4, '0')} ${
                    tx.date.getHours().toString().padStart(2, '0')}:${
                    tx.date.getMinutes().toString().padStart(2, '0')}:${
                    tx.date.getSeconds().toString().padStart(2, '0')}`
                date.innerText = dateString
                from.innerText = tx.from.toLowerCase()
                value.innerText = eth
                tr.appendChild(date)
                tr.appendChild(from)
                tr.appendChild(value)
                table.appendChild(tr)
            })
        }).catch(error => {
            console.log(error);
        })
}
