var App = function(){
  function hello(){
    console.log('hello from App.init()');
  } // end of hello

  return {
    init: function(){
      hello();
    }, // end of init
    // app1
    initHello: function(){
      console.log('hello from App.initHello(5)')
    },
  }; // end of return
}();
