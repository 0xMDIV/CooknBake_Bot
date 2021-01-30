/**
 * Cook n Bake Telegram Bot
 * made with the telegraf framework: https://telegraf.js.org/#/
 * author: github.com/0xMDIV
 * Save Recipes and search on Chefkoch.de
 */

 var debug = false;

 /**
  * Load Packages
  */
 const telegram = require('telegraf');
 const fs = require('fs');
 const sprintf = require('sprintf-js').sprintf;
 const vsprintf = require('sprintf-js').vsprintf;
 const util = require('util');
 const path = require("path");
 const mysql = require('mysql');

 /**
 * Helper to log stuff
 */
class Helper {
    static getLocalTimestamp() {
        return new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin", });
    }

    static getDate() {
        const date = new Date();
        return date.getUTCDate() + "." + (date.getUTCMonth() + 1) + "." + date.getUTCFullYear();
    }

    static timeNow() {
        return Math.floor(Date.now() / 1000);
    }

    static log() {
        if (debug) return;
        var reason = `${arguments[0].split('[').pop().split(']')[0]}`;
        var msg = arguments[0].replace('[' + reason + ']', '').trim();
        db.query('INSERT INTO log (reason, message) VALUES (?, ?)', [reason, msg], function (err, rows, fields) {
            if (err) console.log(err);
        });
    }
}

/**
 * Read the Config File
 */
try {
    var config = JSON.parse(
        fs.readFileSync('./config.json')
    );
} catch (e) {
    Helper.log(util.inspect(err));
}

// ======================================
// MYSQL SETUP
// ======================================
const db = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});
db.connect();

/**
 * Global used Variables
 */
const startedAt = Helper.getLocalTimestamp();
const ONE_DAY = 60 * 60 * 24;


/**
 * Telegram Setup
 * @type telegram
 */
const bot = new telegram(config.bot_token);

bot.command('add', (ctx) => {
    var link = ctx.message.text.substr(5).trim();
    var chatId = ctx.from.id;
    if(link.length > 0) {
        try {
            db.query('INSERT INTO recipes (link, userchatId) VALUES (?, ?)', [link, chatId], function (err, rows, fields) {
                if (err) console.log(err);
            });
            ctx.reply('Added Link to Database');
            Helper.log("[INFO] Added Link " + link)
        } catch (error) {
            ctx.reply('Link couldnt be added!');
            Helper.log("[ERROR] Link konnte nicht geaddet werden: %s", error);
        }
    }
});


bot.command('get', (ctx) => {
    // var search_input = ctx.message.text.substr(5).split(', ');
    var recipes = [];
    var chatId = ctx.from.id;
    var sql_str = `SELECT * FROM recipes WHERE userchatId = "${chatId}"`;
    
    db.query(sql_str, function (err, rows, fields) {
        if (err) {
            Helper.log('[ERROR] Couldnt fetch data from database');
            ctx.reply('Die Rezepte konnten nicht abgerufen werden.');
            return;
        };
        if (rows.length >= 1) {
            for (var i = 0; i < rows.length; i++) {
                recipes.push(rows[i].link);
            };
            ctx.reply(recipes.join("\n\n"));
        } else {
            ctx.reply('Die Rezepte konnten nicht abgerufen werden.');
        }
    });
});


/**
 * Launch the Bot and log the start time
 */
bot.launch()
console.log('Bot was started!');