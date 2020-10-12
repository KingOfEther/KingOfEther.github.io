class KingOfEtherService {
    constructor(web3, contract, account) {
        this.web3 = web3
        this.account = account
        this.contract = contract
        this.becomeRichestHex = this.contract.methods.becomeRichest().encodeABI()
        this.withdrawHex = this.contract.methods.withdraw().encodeABI()
    }

    async history() {
        const key = '7D74BSWRSX3HGI7WJMD18V24D3WFH7HR5K'
        const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${this.contract.options.address}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`
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

    async status() {
        const obj = {
            'richest': await this.contract.methods.richest().call(),
            'remainingTime': await this.contract.methods.remainingTime().call(),
            'mostSent': await this.contract.methods.mostSent().call(),
            'increasePercentage': await this.contract.methods.increasePercentage().call(),
            'gameDuration': await this.contract.methods.gameDuration().call(),
            'startingValue': await this.contract.methods.startingValue().call()
        }
        obj['canStartGame'] = obj['remainingTime'] == 0
        return obj
    }
}

window.onload = () => {
    const infuraUrl = 'wss://mainnet.infura.io/ws/v3/b725b07e9e3c4a5296ff87bd4feb0abc'
    const contractAddress = '0xa8B0d256466248b6E39F03d03Ec1D3815457C5A5'
    const contractAbi = [{"inputs":[{"internalType":"uint256","name":"_gameDuration","type":"uint256"},{"internalType":"uint256","name":"_startingValue","type":"uint256"},{"internalType":"uint256","name":"_increasePercentage","type":"uint256"},{"internalType":"uint256","name":"_transactionFeePercentage","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"king","type":"address"},{"indexed":false,"internalType":"uint256","name":"money","type":"uint256"}],"name":"NewKing","type":"event"},{"inputs":[],"name":"amountWithdrawable","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"becomeRichest","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"gameDuration","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"increasePercentage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mostSent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingTime","outputs":[{"internalType":"uint256","name":"time","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"richest","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"startingValue","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    const etherscan = `https://etherscan.io/address/${contractAddress}`

    const web3 = new Web3(new Web3.providers.WebsocketProvider(infuraUrl))
    const contract = new web3.eth.Contract(contractAbi, contractAddress)
    const service = new KingOfEtherService(web3, contract, null)

    document.getElementById('contractAddress').innerText = contractAddress
    document.getElementById('hexDataDeposit').innerText = service.becomeRichestHex
    document.getElementById('hexDataWithdraw').innerText = service.withdrawHex
    document.getElementById('etherscan').onclick = () => window.open(etherscan, '_blank')

    service.status()
        .then(result => {
            const minValue = web3.utils.fromWei(result.startingValue, 'ether')
            let startGameString = `The previous game has ended. Start a new game by sending at least <u>${minValue} ETH</u> to the contract.`
            let remainingTimeString = `Remaining time: ${result.remainingTime} min`
            let string = result.canStartGame ? startGameString : remainingTimeString
            document.getElementById('status').innerHTML = string
            document.getElementById('increasePercentage').innerText = result.increasePercentage
            document.getElementById('gameDuration').innerText = result.gameDuration
        })
        .catch(error => {
            console.log(error);
        })

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
