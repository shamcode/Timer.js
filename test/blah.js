var Timer = require('../timer.js');

var timer = new Timer(100);

timer.every(100, function(){
  console.log(timer.ticks());
});

timer.start();