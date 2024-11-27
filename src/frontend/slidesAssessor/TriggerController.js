// TriggerController.gs

/**
 * TriggerController Class
 *
 * Manages the creation and deletion of triggers.
 */
class TriggerController {
  constructor() {
    // Initialization logic can be added here if needed
  }

  /**
  * Creates a time-based trigger for the specified function to fire 5 seconds after the current time.
  *
  * @param {string} functionName - The name of the function to trigger.
  * @returns {string} The unique ID of the created trigger.
  */
  createTimeBasedTrigger(functionName) {
    try {
      // Calculate the time 5 seconds from now
      const triggerTime = new Date();
      triggerTime.setSeconds(triggerTime.getSeconds() + 5);

      // Create the trigger for the exact time
      const trigger = ScriptApp.newTrigger(functionName)
        .timeBased()
        .at(triggerTime)
        .create();
      console.log(`Trigger created for ${functionName} to run at ${triggerTime}.`);
      return trigger.getUniqueId();
    } catch (error) {
      console.error(`Error creating trigger for ${functionName}: ${error}`);
      throw error;
    }
  }


  /**
   * Removes all triggers associated with the specified function name.
   *
   * @param {string} functionName - The name of the function whose triggers are to be removed.
   */
  removeTriggers(functionName) {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(trigger);
        console.log(`Trigger for ${functionName} deleted.`);
      }
    });
  }
}
