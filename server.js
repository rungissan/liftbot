require('dotenv-extended').load();
var restify = require('restify');
var builder = require('botbuilder');
var locationDialog = require('botbuilder-location');

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: '73a78204-a51b-481e-af2a-cb72c1c00de3',
    appPassword: 'ACjQzDRONDUOTcdYRcTZruv'
});

const greeting = require('./app/recognizer/greeting');
const commands = require('./app/recognizer/commands');
const smiles = require('./app/recognizer/smiles');

const dialog = {
    welcome: require('./app/dialogs/welcome')
 };

const bot = new builder.UniversalBot(connector, {
    persistConversationData: true
});
bot.library(locationDialog.createLibrary('MS0ktNotOqNdjaTgJZ2o~apVPV9Uqycm9RPuKfUnYbw~AjCxFU1c4GJT_fIAnAEmCyIv-n5P-2g_Diy1lfbUPx99QwQJKpVcufwH_XLPJyYA'));
var intents = new builder.IntentDialog({
    recognizers: [
        commands,
        greeting //,
   //     new builder.LuisRecognizer('7cdc5efae0824f2ba3f02acde270fe98')
    ],
    intentThreshold: 0.2,
    recognizeOrder: builder.RecognizeOrder.series
});

intents.matches('Greeting','/welcome');
intents.matches('Reset', '/reset');
intents.matches('Delete', '/delete');
intents.matches('Smile', '/smileBack');
intents.matches('Greetings2','greetings');
intents.onDefault('/confused');

bot.dialog('/', intents);
dialog.welcome(bot);
bot.dialog('/confused', [
    function (session, args, next) {
        // ToDo: need to offer an option to say "help"
        if (session.message.text.trim()) {
            session.endDialog('Извините,но я потерял нить нашего разговора ((');
        } else {
            session.endDialog();
        }        
    }
]);
// Ask the user for their name and greet them by name.
bot.dialog('greetings', [
   (session, args, next) => {
        const card = new builder.ThumbnailCard(session);
        card.buttons([
            new builder.CardAction(session).title('Купить лифт KONE').value('Buy').type('imBack'),
            new builder.CardAction(session).title('Cообщить о проблеме').value('Alarm').type('imBack'),
        ]).text(`Что бы Вы хотели ?`);

        const message = new builder.Message(session);
        message.addAttachment(card);

        session.send(`Привет! Я - круглосуточный диспетчер компании Lift KZ Astana.`);
        const choices = ['Buy', 'Alarm'];
        builder.Prompts.choice(session, message, choices);
    },
    (session, results, next) => {
       // session.endConversation(`Ваш выбор : ${results.response.entity}`);
        session.beginDialog('askName');
    //    session.send(session.userData.userName);
     //   session.send(session.userData.userPhone);
    }
]);

bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'Пожалуйста,cообщите Ваше имя ?');
    },
    function (session, results) {
           session.userData = Object.assign({}, session.userData, {
                           userName : results.response,
                           lastVisit: new Date()
                                        });
        
           session.save();
           builder.Prompts.text(session, results.response +', сообщите свой телефон в формате (+78888888888)?');
            },
    function (session, results) {
         session.userData = Object.assign({}, session.userData, {
                           userPhone : results.response
                                        });
        
        session.save();
          var options = {
            prompt: "Где произошла поломка?",
            useNativeControl: true,
            reverseGeocode: true,
			skipFavorites: false,
			skipConfirmationAsk: true,
            requiredFields:
                locationDialog.LocationRequiredFields.streetAddress |
                locationDialog.LocationRequiredFields.locality |
                locationDialog.LocationRequiredFields.region |
                locationDialog.LocationRequiredFields.postalCode |
                locationDialog.LocationRequiredFields.country
        };

        locationDialog.getLocation(session, options);
    },
      function (session, results) {
          if (results.response) {
            var place = results.response;
			var formattedAddress = 
            session.send("Спасибо за сигнал, Я срочно сообщу об этом механику " + getFormattedAddressFromPlace(place, ", "));
        }
        session.endDialogWithResult(results);
    }
]);
function getFormattedAddressFromPlace(place, separator) {
    var addressParts = [place.streetAddress, place.locality, place.region, place.postalCode, place.country];
    return addressParts.filter(i => i).join(separator);
}

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Здравствуйте %s... Спасибо,что добавили меня.", name || 'к себе');
        bot.send(reply);
    }
});
bot.on('routing', smiles.smileBack.bind(smiles));

bot.dialog('/reset', [
    function (session, args, next) {
        session.endConversation(['До свидания!', 'Увидимся!', 'Пока!', 'Всех Благ!', 'До новых встреч!']);
    }
]);
bot.dialog('/delete', (session) => {
delete session.userData
session.endDialog('Все удалил и сейчас зависну ))')

})
.triggerAction({
matches: /^delete$/i ,
confirmPrompt: 'Удалить все. Вы уверены ?'
});

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.get(/.*/, restify.plugins.serveStatic({
    'directory': '.',
    'default': 'index.html'
}));
server.post('/api/messages', connector.listen());

