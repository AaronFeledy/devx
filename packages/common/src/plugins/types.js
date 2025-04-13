// Define core plugin interfaces
/** Status of a DevX managed stack */
export var StackStatus;
(function (StackStatus) {
    StackStatus["Unknown"] = "unknown";
    StackStatus["Building"] = "building";
    StackStatus["Starting"] = "starting";
    StackStatus["Running"] = "running";
    StackStatus["Stopping"] = "stopping";
    StackStatus["Stopped"] = "stopped";
    StackStatus["Destroying"] = "destroying";
    StackStatus["Error"] = "error";
    StackStatus["NotCreated"] = "not_created";
})(StackStatus || (StackStatus = {}));
