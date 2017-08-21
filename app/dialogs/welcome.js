var builder = require('botbuilder');

module.exports = function(bot) {
    bot.dialog('/welcome', [
        function (session, args, next) {
            const lastVisit = session.userData.lastVisit;
          //  session.send(session.userData);
         //   var name = message.user ? message.user.name : null;
            session.send(['Здравствуйте!', 'Привет!', 'Салют!', 'Решительно приветствую!']);
          

            if (!lastVisit) {
                session.send('Я - Ваш круглосуточный диспетчер компании ООО Лифт KZ');
                session.userData.userName = null;
                session.userData.userPhone = null;
                session.userData.lift = null;
                session.userData = Object.assign({}, session.userData, {
                           userName : 'радж кумар',
                           userPhone : '+380678882727',
                           lift : '13',
                           lastVisit: new Date()
                });
        
                session.save();
            } else {
                session.send('Рад Вашему возвращению! ' + session.userData.userName);
                session.send(session.userData.userPhone);
             //   session.send(name);        
            }

            session.endDialog('Чем я могу Вам помочь?');
          
        }
     
    ]);
};