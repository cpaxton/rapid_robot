from rapid_robot.msg import InterfaceParams
from rapid_robot.msg import InterfaceSubmission
import json
import random
import rospy


class Interface(object):
    def __init__(self, interface_publisher):
        self._interface_publisher = interface_publisher

    def _publish_params(self, msg):
        rate = rospy.Rate(5)
        while self._interface_publisher.get_num_connections() == 0:
            rate.sleep() 
        self._interface_publisher.publish(msg)

    def display_default(self):
        """Displays the default screen.
        """
        msg = InterfaceParams()
        msg.interface_type = 'default'
        self._publish_params(msg)

    def ask_choice(self, message, choices, timeout=None):
        """Asks the user a multiple choice question.

        Displays a button for each choice in choices. This method blocks until
        the given timeout. If the timeout is exceeded, then None is returned.
        If no timeout is supplied, then this method blocks until a response is
        given.

        Args:
          message: string. The question to ask.
          choices: list of strings. The choices to offer to the user.
          timeout: float. The time, in seconds, to wait for a response, or None
            to wait forever.

        Returns: string. The choice that was selected.
        """
        msg = InterfaceParams()
        msg.interface_type = 'ask_choice'
        prompt_id = str(random.randint(0, 1000000))
        msg.keys = ['message', 'choices', 'prompt_id']
        msg.values = [message, json.dumps(choices), prompt_id]
        self._publish_params(msg)

        # A workaround for the fact that you can't provide services in roslibjs.
        # Normally, we would call a service to set the interface and get the user
        # response, but we can only communicate over topics. We include a random ID
        # with the request and response messages and check if the IDs match.
        submission = None
        response_prompt_id = None  # The prompt_id returned in the response.
        timeout_remaining = timeout
        choice = None
        while response_prompt_id != prompt_id:
            start_time = rospy.Time().now()
            submission = rospy.wait_for_message(
                'rapid_robot/interface/interface_submission',
                InterfaceSubmission, timeout_remaining)

            # If a timeout is set, then possibly break out of the loop.
            wait_duration = (rospy.Time().now() - start_time).to_sec()
            if timeout is not None:
                timeout_remaining = timeout - wait_duration
                if timeout_remaining <= 0:
                    break

            if submission is None:
                continue
            if submission.interface_type != 'ask_choice':
                continue
            if len(submission.keys) != len(submission.values):
                rospy.logerr('[Interface]: unequal keys and values.')
                break
            params = {}
            for k, v in zip(submission.keys, submission.values):
                params[k] = v
            if 'prompt_id' not in params:
                rospy.logerr('[Interface]: no prompt_id given.')
                break
            response_prompt_id = params['prompt_id']
            if response_prompt_id != prompt_id:
                continue
            if 'choice' not in params:
                rospy.logerr('[Interface]: no choice given.')
                break

            choice = params['choice']
        self.display_default()
        return choice

    def say_message(self, message, timeout=None):
        """Displays the given message on the screen.

        If no timeout is given, then the message is shown and this method
        returns immediately. Otherwise, this method blocks for the given
        timeout while the message is being shown.

        Args:
          message: string. The message to show.
          timeout: float. The time, in seconds, to show the message, or None to 
            show the message indefinitely.
        """
        msg = InterfaceParams()
        msg.interface_type = 'display_message'
        msg.keys = ['message']
        msg.values = [message]
        self._publish_params(msg)
        if timeout is not None:
            rospy.sleep(timeout)
            self.display_default()
