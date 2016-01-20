var ros = new ROSLIB.Ros({
  url : 'ws://localhost:9090'
});
ros.on('connection', function() {
  console.log('Connected to websocket server.');
});
ros.on('error', function(error) {
  console.log('Error connecting to websocket server: ', error);
});
ros.on('close', function() {
  console.log('Connection to websocket server closed.');
});

var view_publisher = new ROSLIB.Topic({
  ros: ros,
  name: 'rapid_robot/interface/interface_submission',
  messageType: 'rapid_robot/InterfaceSubmission'
});

if (Meteor.isClient) {
  Template.body.helpers({
    interface_type: function() {
      return Session.get('interface_type');
    },
    interface_params: function() {
      return Session.get('interface_params');
    }
  });

  Template.body.onCreated(function() {
    var that = this;
    Session.setDefault('interface_type', 'default');
    Session.setDefault('interface_params', {});

    this.view_listener = new ROSLIB.Topic({
      ros: ros,
      name: 'rapid_robot/interface/interface_params',
      messageType: 'rapid_robot/InterfaceParams'
    });

    this.view_listener.subscribe(function(message) {
      Session.set('interface_type', message.interface_type);
      var params = {}
      for (var i=0; i<message.keys.length; i+=1) {
        var key = message.keys[i];
        var value = message.values[i];
        if (message.interface_type === 'ask_choice') {
          if (key === 'choices') {
            value = JSON.parse(value);
          }
          if (key === 'prompt_id') {
            Session.set('prompt_id', value);
          }
        }
        params[key] = value;
      }
      Session.set('interface_params', params);
    });

  });

  Template.ask_choice.events({
    'click .select-choice': function(event) {
      var submission = new ROSLIB.Message({
        interface_type: 'ask_choice',
        keys: ['choice', 'prompt_id'],
        values: [event.target.value, Session.get('prompt_id')]
      });
      view_publisher.publish(submission);
    
      return false;
    }
  });
}
