const discord = require("discord.js");
const rp = require("request-promise");
const jsonfile = require("jsonfile");
const logger = require('winston');
const apikey = require("./apikey.json");
const utf8 = require('utf8');

const client = new discord.Client({ autoreconnect: true });

const wows_ID_url = "https://api.worldofwarships.asia/wows/account/list/?search=";
const wows_DATA_url = "https://api.worldofwarships.asia/wows/account/info/?application_id=";
const wows_CLAN_url = "https://api.worldofwarships.asia/wows/clans/list/?search=";

client.login(apikey.token);

let command;
let name, userID;
let wins, losses, battles, averagedamage, clan, winrate;

function ERROR() {
    let temp = "Wrong ID";
    return temp;
}

function sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan) {
    let temp = new discord.RichEmbed()
        .setTitle("Know your enemy~")
        .setThumbnail("https://i.imgur.com/cO8B0P8.jpg")
        .setColor(3447003)
        .addField("PlayerName:",name)
        .addField("Total Battles:", battles)
        .addField("Winrate:", winrate + "%")
        .addField("Averagedamage:", averagedamage)
        .addField("Clan:",clan)
        .setFooter("Matsuura Kanan")
        .setTimestamp();
    return temp;
}

function sendmessagetodiscord_clan() {
    let temp = ""; 
}

client.on('ready', function (evt) {
    logger.info("Connect");

    logger.info('Logged in as: ');

    logger.info(client.user.username + ' - (' + client.user.id + ')');
})

client.on('message', (message) => {
    var embed;
    
    if (message.content.substring(0, 2) == ">>") {
        command = message.content.split('>>')[1];
        console.log(command);
        name = command.split(' ')[1];
        command = command.split(' ')[0];
        command = command.toLowerCase();
        switch (command) {
            case "clan":
                message.channel.send("work in progress....");
                break;

            case "player":
                rp(wows_ID_url + name + "&application_id=" + apikey.ApiKey).then(data => {
                    let temp = JSON.parse(data);
                    if (temp.data[0] != null) {
                        name = temp.data[0].nickname;
                        userID = temp.data[0].account_id;
                        userID = userID.toString();
                        //
                        rp(wows_DATA_url + apikey.ApiKey + "&account_id=" + userID).then(data => {
                            let tempA = JSON.parse(data);
                            if (tempA.status == "ok") {
                                if (tempA.data[userID] != null) {
                                    //
                                    wins = tempA.data[userID].statistics.pvp.wins;
                                    losses = tempA.data[userID].statistics.pvp.losses;
                                    battles = wins + losses;
                                    averagedamage = (tempA.data[userID].statistics.pvp.damage_dealt / battles).toFixed(0);
                                    winrate = ((wins / battles) * 100).toFixed(2);
                                    //
                                    embed = sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan);
                                    message.channel.send({ embed });
                                }
                                else {
                                    embed = ERROR();
                                    message.channel.send(embed);
                                }
                            }
                            else {
                                embed = ERROR();
                                message.channel.send(embed);
                            }


                        })
                    }
                    else {
                        embed = ERROR();
                        message.channel.send(embed);
                    }

                })
                break;

            default:
                message.channel.send("指令錯誤，請不要亂玩我，謝謝");
                break;
        }

        
    }
})
