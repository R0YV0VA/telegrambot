const TelegramApi = require('node-telegram-bot-api')
const clickhouse = require('./db.js')
const { gameOption, againOption } = require('./option.js')


const token = "5466456652:AAEmjKTsdcJaCtQ6C7MGDZsSrrTepxEYmK8"
const chats = {}
const bot = new TelegramApi(token, {polling: true})

const startGame = async (chat_id) => {
    await bot.sendMessage(chat_id, 'I will guess a number from 0 to 9, and you have to guess it')
    const randomNumber = Math.floor(Math.random() * 10).toString()
    chats[chat_id] = randomNumber
    await bot.sendMessage(chat_id, 'Guess!', gameOption)
}

bot.setMyCommands([
    {command: '/start', description: 'Welcoming'},
    {command: '/info', description: 'Information about you'},
    {command: '/game', description: 'Simple game'},
    {command: '/exit', description: 'Exit from game'}
])

const createUser = async (user_name) => {
    try{
    const isExist = await clickhouse.query(`SELECT * FROM score WHERE user_name = '${user_name}'`).toPromise()
    if(isExist.length == 0){
        await clickhouse.query(`INSERT INTO score (* EXCEPT(correct, wrong)) VALUES ('${user_name}');`).toPromise()
        return true
    }
    else{
        return false
    }
    }
    catch(e){
        console.log(e)
    }
}

const informationAboutUser = async (user_name) => {
    try{
    const user = await clickhouse.query(`SELECT * FROM score WHERE user_name = '${user_name}'`).toPromise()
    return user[0]
    }
    catch(e){
        console.log(e)
    }
}

const addCorrect = async (user_name) => {
    try{
    const user = await clickhouse.query(`SELECT * FROM score WHERE user_name = '${user_name}'`).toPromise()
    await clickhouse.query(`ALTER TABLE score UPDATE correct = ${user[0].correct+1} WHERE user_name = '${user_name}'`).toPromise()
    }
    catch(e){
        console.log(e)
    }
}

const addWrong = async (user_name) => {
    try{
    const user = await clickhouse.query(`SELECT * FROM score WHERE user_name = '${user_name}'`).toPromise()
    await clickhouse.query(`ALTER TABLE score UPDATE wrong = ${user[0].wrong+1} WHERE user_name = '${user_name}'`).toPromise()
    }
    catch(e){
        console.log(e)
    }
}

// function for removing user from database
const removeUser = async (user_name) => {
    try{
        await clickhouse.query(`ALTER TABLE score DELETE WHERE user_name = '${user_name}'`).toPromise()
    }
    catch(e){
        console.log(e)
    }
}

const start = () => {
    bot.on('message', async (msg) => {
        const message = msg.text
        const user_name = msg.chat.username
        const chat_id = msg.chat.id
        if(message === '/start')
        {
            const creatingUser = await createUser(user_name)
            if(!creatingUser){
                return bot.sendMessage(chat_id, `Your account is already exist!`)
            }
            else{
                await bot.sendSticker(chat_id, 'https://tlgrm.eu/_/stickers/1b5/0ab/1b50abf8-8451-40ca-be37-ffd7aa74ec4d/2.webp')
                return bot.sendMessage(chat_id, `Welcome to gachi bot on node.js`)
            }
        }
        if(message === '/info')
        {
            const user = await informationAboutUser(user_name)
            return bot.sendMessage(chat_id, `${user_name} your statistic\ncorrect answers: ${user.correct}\nwrong answers: ${user.wrong}`)
        }
        if(message === '/game'){
            return startGame(chat_id)
        }
        if(message === '/exit'){
            removeUser(user_name)
            return bot.sendMessage(chat_id, `Bye!`)
        }
        return bot.sendMessage(chat_id, 'I don`t understand you')
    })

    bot.on('callback_query', async (msg) => {
        const data = msg.data
        const chat_id = msg.message.chat.id
        const message_id = msg.message.message_id
        const user_name = msg.message.chat.username
        if(data === '/again'){
            await bot.deleteMessage(chat_id, message_id)
            return startGame(chat_id)
        }
        if(chats[chat_id] === data){
            await addCorrect(user_name)
            await bot.deleteMessage(chat_id, message_id - 1)
            await bot.deleteMessage(chat_id, message_id)
            return bot.sendMessage(chat_id, `${data} is correct!`, againOption)
        }
        else{
            await addWrong(user_name)
            const correctNumber = chats[chat_id]
            chats[chat_id] = Math.floor(Math.random() * 10).toString()
            await bot.deleteMessage(chat_id, message_id - 1)
            await bot.deleteMessage(chat_id, message_id)
            return bot.sendMessage(chat_id, `Wrong! Correct was ${correctNumber}`, againOption)
        }
    })
}
start()