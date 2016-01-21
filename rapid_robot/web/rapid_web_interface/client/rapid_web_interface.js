if (Meteor.isClient) {
  Template.body.helpers({
    displayType: function() {
      var dt = Display.findOne('displayType')
      return dt ? dt.displayType : 'displayMessage';
    },
    displayParams: function() {
      var params = Display.findOne('displayParams');
      return params ? params : {h1text: 'Hello world!'};
    },
    equal: function(displayType, name) {
      console.log(displayType + name);
      return displayType === name;
    }
  });

  Template.body.onCreated(function() {
    var that = this;
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
