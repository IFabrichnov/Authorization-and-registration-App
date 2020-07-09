const Article = require('../models/Article');

module.exports = function (app, passport) {
  //домашняя страница
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  //login форма
  app.get('/login', function (req, res) {
    res.render('login.ejs', {message: req.flash('loginMessage')});
  });
  //процесс в логин форме
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/quotes',
    failureRedirect: '/login',
    failureFlash: true
  }));


  //register форма
  app.get('/register', function (req, res) {
    res.render('register.ejs', {message: req.flash('registerMessage')});
  });
  //процесс в регистр форме
  app.post('/register', passport.authenticate('local-register', {
    successRedirect: '/quotes',
    failureRedirect: '/register',
    failureFlash: true
  }));


  //помещаем посты в базу данных
  app.post('/quotes', async (req, res) => {
      const article = new Article({
        title: req.body.title,
        description: req.body.description
      });

      await article.save();
      //после сохранения в базу данных сообщения, редиректим на эту же страницу
      res.redirect('/quotes');
    }
  );


//подключаю форму с написанием постов
//через модель Article находим массив всех элементов из базы данных
//рендерим ejs вместо html, в файл данные массива из бд
  app.get("/quotes", isLoggedIn, (req, res) => {
    Article.find()
      .then(result => res.render("quotes.ejs", {quotes: result}))
  });


  //logout
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

};

function isLoggedIn(req, res, next) {
  // если пользователь аутентифицирован в сеансе, то пропускает дальше
  if (req.isAuthenticated())
    return next();
  // если нет, то редирект
  res.redirect('/');
}


