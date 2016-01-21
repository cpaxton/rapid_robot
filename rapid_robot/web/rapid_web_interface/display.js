Display = new Mongo.Collection('display');

Meteor.methods({
  setDisplay: function(displayType, displayParams) {
    Display.update('displayType', {$set: {'displayType': displayType}}, {upsert: true});
    if (displayParams) {
      Display.update('displayParams', displayParams, {upsert: true});
    }
  }
});
