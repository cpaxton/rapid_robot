if (Meteor.isServer) {
  // The implementation of the primitives.
  var robot = function() {
    var displayMessage = function(h1text, h2text) {
      Meteor.call('setDisplay', 'displayMessage', {h1text: h1text, h2text: h2text});
    };

    return {
      displayMessage: displayMessage,
    };
  }();

  var interpreterApi = function(interpreter, scope) {
    var myRobot = interpreter.createObject(interpreter.OBJECT);
    interpreter.setProperty(scope, 'robot', myRobot);

    var wrapper = function(h1text, h2text) {
      h1text = h1text ? h1text.toString() : '';
      h2text = h2text ? h2text.toString() : '';
      return interpreter.createPrimitive(robot.displayMessage(h1text, h2text));
    };
    interpreter.setProperty(myRobot, 'displayMessage', interpreter.createNativeFunction(wrapper));
  };

  Meteor.startup(function() {
    Meteor.call('setDisplay', 'displayMessage', {h1text: 'Hello world!'});
    Meteor.methods({
      runProgram: function(program) {
        if (program === undefined || program.length <= 0) {
          throw new Meteor.Error(400, 'No program given.');
        }
        var interpreter = new Interpreter(program, interpreterApi);
        try {
          interpreter.run();
        } catch(e) {
          throw new Meteor.Error(400, 'Program was invalid. ' + e);
        }
      }
    });
  });
}
