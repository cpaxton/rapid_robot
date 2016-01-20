if (Meteor.isServer) {
  Meteor.startup(function() {
    Meteor.methods({
      runProgram: function(program) {
        if (program === undefined || program.length <= 0) {
          throw new Meteor.Error(400, 'No program given.');
        }
      }
    });
  });
}
