const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  //стратегия регистрации
  passport.use('local-register', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      process.nextTick(() => {
        User.findOne({'email': email}, (err, user) => {
          if (err)
            return done(err);
          if (user) {
            return done(null, false, req.flash('registerMessage', 'Почта уже использована'));
          } else {
            var newUser = new User();
            newUser.email = email;
            newUser.password = newUser.generateHash(password);

            //cохраняем нового пользователя
            newUser.save(function (err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }

        });

      });

    }));


  //стратегия логина
  passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    (req, email, password, done) => {
      // ищем пользователя с данной почтой
      // проверка, существует ли пользователь
      User.findOne({'email': email}, function (err, user) {
        if (err)
          return done(err);
        if (!user)
          return done(null, false, req.flash('loginMessage', 'Нет такого пользователя.'));
        // если пользователь найден , но пароль неверный
        if (!user.validPassword(password))
          return done(null, false, req.flash('loginMessage', 'Неверный пароль!'));

        // все ок
        return done(null, user);
      });

    }));
};
