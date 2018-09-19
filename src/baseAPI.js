module.exports = function(scope) {

  var constants = {
    SCORM_TRUE: "true",
    SCORM_FALSE: "false",

    STATE_NOT_INITIALIZED: 0,
    STATE_INITIALIZED: 1,
    STATE_TERMINATED: 2,

    LOG_LEVEL_DEBUG: 1,
    LOG_LEVEL_INFO: 2,
    LOG_LEVEL_WARNING: 3,
    LOG_LEVEL_ERROR: 4,
    LOG_LEVEL_NONE: 5
  };

  function scormAPI() {
    var _self = scope;

    // Internal State
    _self.currentState = constants.STATE_NOT_INITIALIZED;
    _self.lastErrorCode = 0;

    // Utility Functions
    _self.apiLog = apiLog;
    _self.apiLogLevel = constants.LOG_LEVEL_ERROR;
    _self.clearSCORMError = clearSCORMError;
    _self.getLmsErrorMessageDetails = getLmsErrorMessageDetails;
    _self.isInitialized = isInitialized;
    _self.isNotInitialized = isNotInitialized;
    _self.isTerminated = isTerminated;
    _self.listenerArray = [];
    _self.on = onListener;
    _self.processListeners = processListeners;
    _self.throwSCORMError = throwSCORMError;
  }

  /**
   * Logging for all SCORM actions
   *
   * @param functionName
   * @param CMIElement
   * @param logMessage
   * @param messageLevel
   */
  function apiLog(functionName, CMIElement, logMessage, messageLevel) {
    logMessage = formatMessage(functionName, CMIElement, logMessage);

    if (messageLevel >= scope.apiLogLevel) {
      switch (messageLevel) {
        case constants.LOG_LEVEL_ERROR:
          console.error(logMessage);
          break;
        case constants.LOG_LEVEL_WARNING:
          console.warn(logMessage);
          break;
        case constants.LOG_LEVEL_INFO:
          console.info(logMessage);
          break;
      }
    }
  }

  /**
   * Clears the last SCORM error code on success
   */
  function clearSCORMError(success) {
    if (success !== constants.SCORM_FALSE) {
      scope.lastErrorCode = 0;
    }
  }

  /**
   * Formats the SCORM messages for easy reading
   *
   * @param functionName
   * @param CMIElement
   * @param message
   * @returns {string}
   */
  function formatMessage(functionName, CMIElement, message) {
    var baseLength = 20;
    var messageString = "";

    messageString += functionName;

    var fillChars = baseLength - messageString.length;

    for (var i = 0; i < fillChars; i++) {
      messageString += " ";
    }

    messageString += ": ";

    if (CMIElement) {
      var CMIElementBaseLength = 70;

      messageString += CMIElement;

      fillChars = CMIElementBaseLength - messageString.length;

      for (var j = 0; j < fillChars; j++) {
        messageString += " ";
      }
    }

    if (message) {
      messageString += message;
    }

    return messageString;
  }

  /**
   * Returns the message that corresponds to errrorNumber
   * APIs that inherit BaseAPI should override scope function
   */
  function getLmsErrorMessageDetails(_errorNumber, _detail) {
    return "No error";
  }

  /**
   * Returns true if the API's current state is STATE_INITIALIZED
   */
  function isInitialized() {
    return scope.currentState === constants.STATE_INITIALIZED;
  }

  /**
   * Returns true if the API's current state is STATE_NOT_INITIALIZED
   */
  function isNotInitialized() {
    return scope.currentState === constants.STATE_NOT_INITIALIZED;
  }

  /**
   * Returns true if the API's current state is STATE_TERMINATED
   */
  function isTerminated() {
    return scope.currentState === constants.STATE_TERMINATED;
  }

  /**
   * Provides a mechanism for attaching to a specific SCORM event
   *
   * @param listenerString
   * @param callback
   */
  function onListener(listenerString, callback) {
    if (!callback) return;

    var listenerSplit = listenerString.split(".");
    if (listenerSplit.length === 0) return;

    var functionName = listenerSplit[0];

    var CMIElement = null;
    if (listenerSplit.length > 1) {
      CMIElement = listenerString.replace(functionName + ".", "");
    }

    scope.listenerArray.push({
      functionName: functionName,
      CMIElement: CMIElement,
      callback: callback
    });
  }

  /**
   * Processes any 'on' listeners that have been created
   *
   * @param functionName
   * @param CMIElement
   * @param value
   */
  function processListeners(functionName, CMIElement, value) {
    for (var i = 0; i < scope.listenerArray.length; i++) {
      var listener = scope.listenerArray[i];
      var functionsMatch = listener.functionName === functionName;
      var listenerHasCMIElement = !!listener.CMIElement;
      var CMIElementsMatch = listener.CMIElement === CMIElement;

      if (functionsMatch && (!listenerHasCMIElement || CMIElementsMatch)) {
        listener.callback(CMIElement, value);
      }
    }
  }

  /**
   * Throws a SCORM error
   *
   * @param errorNumber
   * @param message
   */
  function throwSCORMError(errorNumber, message) {
    if (!message) {
      message = scope.getLmsErrorMessageDetails(errorNumber);
    }

    scope.apiLog("throwSCORMError", null, errorNumber + ": " + message, constants.LOG_LEVEL_ERROR);

    scope.lastErrorCode = String(errorNumber);
  }

  return scormAPI();
};