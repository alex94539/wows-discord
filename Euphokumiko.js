const discord   = require("discord.js");
const rp        = require("request-promise");
const jsonfile  = require("jsonfile");
const logger    = require('winston');
const apikey    = require("./apikey.json");
const shipdata  = require("./shipdata.json");
const utf8      = require('utf8');

const client = new discord.Client({ autoreconnect: true });

const wows_ID_url           = "https://api.worldofwarships.asia/wows/account/list/?search=";
const wows_CLAN_ID_url      = "https://api.worldofwarships.asia/wows/clans/accountinfo/?application_id=";
const wows_CLAN_ID_TAG_url  = "https://api.worldofwarships.asia/wows/clans/list/?application_id=";
const wows_DATA_url         = "https://api.worldofwarships.asia/wows/account/info/?application_id=";
const wows_CLAN_url         = "https://api.worldofwarships.asia/wows/clans/info/?application_id=";
const wows_SHIP_DATA_url    = "https://api.worldofwarships.asia/wows/ships/stats/?application_id=";

const Euphokumiko = "<@305696867084140547>";

client.login(apikey.token);

let command;
let name, userID, clanID, shipname;
let wins, losses, battles, averagedamage, clan, winrate, ship;
let createdAt;
let clanleader, clanname, membernum;
let flginsd;
let averagefrag, averageexp;
let picurl;

function initilize() {
    ship = "";
    name = "";
    command = "";
    userID = "";
    clanID = "";
}

function check(a) { // check if is null
    if (a != null) {
        return true;
    }
    else {
        return false;
    }
}

function inputerror(channel) { //wrong input format
    channel.send("輸入格式有誤，回國小重修好嗎?");
}

function ERROR(channel) { //can't find player or clan
    channel.send("查無此人／公會，請重新輸入");
}

function shiperror(channel) { //can't find this ship
    channel.send("查無此船，請檢查拼字或使用英文查詢");
}

function noshiprecord(channel) { //no play record
    channel.send("該玩家沒有此船艦的遊玩紀錄");
}

function sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan, channel) { //send player's data to discord data
    let embed = new discord.RichEmbed()
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
    channel.send({ embed });
}

function sendmessagetodiscord_clan(clanname, clanleader, membernum, clan, channel) { //send clan data to discord channel
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

function sendmessagetodiscord_ship(shipname, name, userID, wins, battles, averagedamage, averageexp, picurl, channel) { //send player's ship data to discord channel
    let winrate = ((wins / battles) * 100).toFixed(2);
    let embed = new discord.RichEmbed()
        .setTitle("查水表時間！")
        .setThumbnail(picurl)
        .setColor(3447003)
        .addField("玩家暱稱：", name)
        .addField("船艦名稱", shipname)
        .addField("戰鬥場數", battles)
        .addField("勝率", winrate + "%")
        .addField("場均傷害：", averagedamage.toFixed(0))
        .addField("場均經驗：", averageexp.toFixed(0))
        .addField("場均擊沉：", averagefrag.toFixed(1))
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
    if (message.content.substring(0, 2) == ">>") {
        initilize();
        let msg = message.content;
        msg = msg.split('>>')[1];
        console.log(message.guild.name + " " + msg);
        name = msg.split(' ')[1];
        command = msg.split(' ')[0];
        command = command.toLowerCase();
        //console.log(command + " " + name);
        if (check(command)) {
            switch (command) {
                case "clan":
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
                        inputerror(message.channel);
                    }
                    break;

                case "player":
                    clan = "無公會";
                    if (check(name)) {
                        rp(wows_ID_url + name + "&application_id=" + apikey.ApiKey).then(data => {
                            let temp = JSON.parse(data);
                            if (temp.data[0] != null) {
                                flginsd = false;
                                for (let m = 0; m < temp.data.length; m++) {
                                    if (temp.data[m].nickname.toLowerCase() == name.toLowerCase()) {
                                        name = temp.data[0].nickname;
                                        userID = temp.data[0].account_id;
                                        userID = userID.toString();
                                        flginsd = true;
                                        break;
                                    }
                                }
                                if (flginsd) {
                                    rp(wows_DATA_url + apikey.ApiKey + "&account_id=" + userID).then(data => {
                                        let tempA = JSON.parse(data);
                                        if ((tempA.status == "ok") && (tempA.data[userID]!=null)) {
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
                                                if ((tempB.data[userID] != null) && (tempB.status == "ok") && (tempB.data[userID].clan_id != null)) {
                                                    clanID = tempB.data[userID].clan_id;
                                                    rp(wows_CLAN_url + apikey.ApiKey + "&clan_id=" + clanID).then(data => {
                                                        let tempC = JSON.parse(data);
                                                        if (tempC.data != null) {
                                                            clan = tempC.data[clanID].tag;
                                                            sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan, message.channel);
                                                        }
                                                    })
                                                }
                                                else {
                                                    sendmessagetodiscord_player(name, userID, wins, battles, averagedamage, winrate, clan, message.channel);
                                                }
                                            })
                                        }
                                        else {
                                            ERROR(message.channel);
                                        }

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
                        inputerror(message.channel);
                    }
                    break;

                case "playership":
                    if (message.content.split(' ')[2] != null) {
                        ship = message.content.match(/>>(.+?) (.+?) (.+)/)[3];
                    }
                    else {
                        inputerror(message.channel);
                        break;
                    }                    
                    if (check(ship)) {
                        rp(wows_ID_url + name + "&application_id=" + apikey.ApiKey).then(data => {
                            let temp = JSON.parse(data);
                            if (temp.data[0] != null) {
                                flginsd = false;
                                for (let m = 0; m < temp.data.length; m++) {
                                    if (temp.data[m].nickname.toLowerCase() == name.toLowerCase()) {
                                        name = temp.data[0].nickname;
                                        userID = temp.data[0].account_id;
                                        userID = userID.toString();
                                        flginsd = true;
                                        //console.log(name + " " + userID);
                                        break;
                                    }
                                }
                                if (flginsd) {
                                    let ui = false;
                                    let index, ship_id;
                                    for (let j = 0; j < shipdata.length; j++) {
                                        for (let z = 0; z < shipdata[j].name.length; z++) {
                                            if (ship.toLowerCase() === shipdata[j].name[z].toLowerCase()) {
                                                ui = true;
                                                break;
                                            }
                                        }
                                        if (ui) {
                                            index = j;
                                            picurl = shipdata[index].picurl;
                                            break;
                                        }
                                    }
                                    if (ui) {
                                        shipname = shipdata[index].name[shipdata[index].name.length - 1];
                                        ship_id = shipdata[index].id;
                                        //console.log(index + " " + shipname + " " + ship_id);
                                        //console.log(wows_SHIP_DATA_url + apikey.ApiKey + "&ship_id=" + ship_id + "&account_id=" + userID);
                                        rp(wows_SHIP_DATA_url + apikey.ApiKey + "&ship_id=" + ship_id + "&account_id=" + userID).then(data => {
                                            let temp = JSON.parse(data);
                                            //console.log(temp);
                                            //console.log(temp.data[userID][0].pvp.wins);
                                            if (temp.data[userID] != null) {
                                                wins = temp.data[userID][0].pvp.wins;
                                                losses = temp.data[userID][0].pvp.losses;
                                                battles = wins + losses;
                                                averagedamage = temp.data[userID][0].pvp.damage_dealt / battles;
                                                averagefrag = temp.data[userID][0].pvp.frags / battles;
                                                averageexp = temp.data[userID][0].pvp.xp / battles;
                                                sendmessagetodiscord_ship(shipname, name, userID, wins, battles, averagedamage, averageexp, picurl, message.channel);
                                            }
                                            else {
                                                noshiprecord(message.channel);
                                            }
                                        })
                                    }
                                    else {
                                        ERROR(message.channel);
                                    }
                                }
                                else {
                                    shiperror(message.channel);
                                }
                            }
                            else {
                                ERROR(message.channel);
                            }
                        })
                    }
                    else {
                        inputerror(message.channel);
                    }
                    break;

                case "help":
                    message.channel.send(Euphokumiko + " @NCTU");
                    break;

                default:
                    message.channel.send("指令錯誤，請不要亂玩我，謝謝");
                    break;
            }
        }
        else {
            inputerror(message.channel);
        }

        
    }
})
