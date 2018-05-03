const discord = require("discord.js");
const rp = require("request-promise");
const jsonfile = require("jsonfile");
const logger = require('winston');
const apikey = require("./apikey.json");
const utf8 = require('utf8');

const client = new discord.Client({ autoreconnect: true });

const wows_ID_url = "https://api.worldofwarships.asia/wows/account/list/?search=";
const wows_CLAN_ID_url = "https://api.worldofwarships.asia/wows/clans/accountinfo/?application_id=";
const wows_CLAN_ID_TAG_url = "https://api.worldofwarships.asia/wows/clans/list/?application_id="
const wows_DATA_url = "https://api.worldofwarships.asia/wows/account/info/?application_id=";
const wows_CLAN_url = "https://api.worldofwarships.asia/wows/clans/info/?application_id=";

client.login(apikey.token);

//

let command;
let name, userID, clanID;
let wins, losses, battles, averagedamage, clan, winrate, ship;
let createdAt;
let clanleader, clanname, membernum;

function check(a) {
    if (a != null) {
        return true;
    }
    else {
        return false;
    }
}

function error(channel) {
    channel.send("輸入格式有誤，回國小重修好嗎?");
}

function ERROR(channel) {
    channel.send("查無此人／公會，請重新輸入");
}

function sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan) {
    let temp = new discord.RichEmbed()
        .setTitle("查水表時間！")
        .setThumbnail("https://i.imgur.com/cO8B0P8.jpg")
        .setColor(3447003)
        .addField("玩家暱稱：",name)
        .addField("戰鬥場數：", battles)
        .addField("勝率：", winrate + "%")
        .addField("場均傷害：", averagedamage)
        .addField("公會標籤：",clan)
        .setFooter("松浦　果南")
        .setTimestamp();
    return temp;
}

function sendmessagetodiscord_clan(clanname, clanleader, membernum, clan, channel) {
    //console.log(clanname + " " + clanleader + " " + membernum + " " + clan);
    let embed = new discord.RichEmbed()
        .setTitle("查水表時間！")
        .setThumbnail("https://i.imgur.com/cO8B0P8.jpg")
        .setColor(3447003)
        .addField("公會名稱：", clanname + "(" + clan + ")")
        .addField("公會長：", clanleader)
        .addField("公會人數：", membernum)
        .setFooter("松浦　果南")
        .setTimestamp();
    channel.send({ embed });
}

client.on('ready', function (evt) {
    client.user.setActivity("我是Euphokumiko老婆喔~~");
    logger.info("Connected");
    logger.info('Logged in as: ');
    logger.info(client.user.username + ' - (' + client.user.id + ')');
})

client.on('message', (message) => {
    var embed;
    
    if (message.content.substring(0, 2) == ">>") {
        command = message.content.split('>>')[1];
        //console.log(command);
        ship = command.split(' ')[2];
        name = command.split(' ')[1];
        command = command.split(' ')[0];
        command = command.toLowerCase();
        if (check(command)) {
            switch (command) {
                case "clan":
                    //message.channel.send("work in progress....");
                    if (check(name)) {
                        rp(wows_CLAN_ID_TAG_url + apikey.ApiKey + "&search=" + name).then(data => {
                            let temp = JSON.parse(data);
                            name = name.toUpperCase();
                            //console.log(wows_CLAN_ID_TAG_url + apikey.ApiKey + "&search=" + name);
                            if (temp.data[0] != null) {
                                let flag = false, flagnum;
                                //console.log(temp.data.length);
                                for (let y = 0; y < temp.data.length; y++) {
                                    //console.log(temp.data[y].tag);
                                    if (temp.data[y].tag === name) {
                                        flag = true;
                                        flagnum = y;
                                        clanID = temp.data[y].clan_id;
                                        break;
                                    }
                                }
                                if (flag) {
                                    rp(wows_CLAN_url + apikey.ApiKey + "&clan_id=" + clanID).then(data => {
                                        //console.log(wows_CLAN_url + apikey.ApiKey + "&clan_id=" + clanID);
                                        let tempA = JSON.parse(data);
                                        clanname = tempA.data[clanID].name;
                                        //console.log(clanname);
                                        clanleader = tempA.data[clanID].leader_name;
                                        membernum = tempA.data[clanID].members_count;
                                        clan = tempA.data[clanID].tag;
                                        sendmessagetodiscord_clan(clanname, clanleader, membernum, clan, message.channel);
                                    })
                                }
                                else {
                                    ERROR(message.channel);
                                }
                            }
                            else {
                                ERROR(message.channel);
                            }
                        })
                    }
                    else {
                        error(message.channel);
                    }
                    break;

                case "player":
                    clan = "無公會";
                    if (check(name)) {
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
                                            //
                                            rp(wows_CLAN_ID_url + apikey.ApiKey + "&account_id=" + userID).then(data => {
                                                let tempB = JSON.parse(data);
                                                if (tempB.data[userID] != null) {
                                                    clanID = tempB.data[userID].clan_id;
                                                    rp(wows_CLAN_url + apikey.ApiKey + "&clan_id=" + clanID).then(data => {
                                                        let tempC = JSON.parse(data);
                                                        if (tempC.data != null) {
                                                            clan = tempC.data[clanID].tag;
                                                            embed = sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan);
                                                            message.channel.send({ embed });
                                                        }
                                                    })
                                                }
                                                else {
                                                    embed = sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan);
                                                    message.channel.send({ embed });
                                                }
                                            })


                                            //



                                        }
                                        else {
                                            ERROR(message.channel);
                                        }
                                    }
                                    else {
                                        ERROR(message.channel);
                                    }

                                })
                            }
                            else {
                                ERROR(message.channel);
                            }

                        })
                    }
                    else {
                        error(message.channel);
                    }
                    break;

                case "playership":
                    if (check(ship)) {

                    }
                    else {
                        error(message.channel);
                    }
                    message.channel.send("work in progress...");
                    break;

                default:
                    let msg = "指令錯誤，請不要亂玩我，謝謝";

                    message.channel.send(msg);
                    break;
            }
        }
        else {
            error(message.channel);
        }

        
    }
})
