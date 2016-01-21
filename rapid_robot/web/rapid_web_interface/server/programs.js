if (Meteor.isServer) {
  // The implementation of the primitives.
  var robot = function() {
    var displayMessage = Meteor.wrapAsync(function(h1text, h2text, timeout, callback) {
      Meteor.call('setDisplay', 'displayMessage', {h1text: h1text, h2text: h2text, timeout: timeout});
      if (timeout > 0) {
        Meteor.setTimeout(function() {
          callback(null, null); // err, result
        }, timeout * 1000);
      } else {
        callback(null, null);
      }
    });

    return {
      displayMessage: displayMessage,
    };
  }();

  // Add hooks for each primitive to the interpreter.
  var interpreterApi = function(interpreter, scope) {
    var myRobot = interpreter.createObject(interpreter.OBJECT);
    interpreter.setProperty(scope, 'robot', myRobot);

    var wrapper = function(h1text, h2text, timeout) {
      h1text = h1text ? h1text.toString() : '';
      h2text = h2text ? h2text.toString() : '';
      timeout = timeout ? timeout.toNumber() : 0;
      return interpreter.createPrimitive(robot.displayMessage(h1text, h2text, timeout));
    };
    interpreter.setProperty(myRobot, 'displayMessage', interpreter.createNativeFunction(wrapper));
  };

  Meteor.startup(function() {
    Meteor.call('setDisplay', 'default');
    Meteor.methods({
      runProgram: function(program) {
        if (program === undefined || program.length <= 0) {
          throw new Meteor.Error(400, 'No program given.');
        }
        var interpreter = new Interpreter(program, interpreterApi);
        try {
          interpreter.run();
          Meteor.call('endProgram');
        } catch(e) {
          throw new Meteor.Error(400, 'Program was invalid. ' + e);
        }
      },
      endProgram: function() {
        Meteor.call('setDisplay', 'default');
      }
    });
  });
}
