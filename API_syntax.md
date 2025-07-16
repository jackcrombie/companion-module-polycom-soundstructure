# Polycom SoundStructure - Learned API Syntax

This document contains practical notes on the SoundStructure command protocol, based on behavior observed during the development of the Companion module.

## 1. Command Termination

-   **Sending:** Commands sent to the device must be terminated with a carriage return and a line feed (`\r\n`).
-   **Receiving:** The device terminates all of its responses with a single carriage return (`\r`).

## 2. List Commands (`vclist`, `vcglist`)

The device has specific commands for listing configuration items. These commands do not use the `get` verb.

### Virtual Channels (`vclist`)

-   **Command:** `vclist`
-   **Response Stream:** The device responds with a stream of `vcitem "Label" type pctype` lines.
-   **End of List:** The device signals the end of the list by sending back the original command, `vclist`.

### Virtual Channel Groups (`vcglist`)

-   **Command:** `vcglist` (sent with no arguments)
-   **Response Stream:** The device responds with a stream of `vcgitem "GroupName" "Member1" "Member2" ...` lines.
-   **End of List:** The device signals the end of the list by sending back the original command, `vcglist`.

## 3. Parameter Commands

-   **Syntax:** These commands follow the structure `verb parameter "object" [value]`.
-   **Verbs:** `get`, `set`, `tog`, `inc`, `dec`, `run`.
-   **Responses:** Successful commands are acknowledged with a `val parameter "object" = value` response. Invalid commands receive an `error "message"` response.
-   **Event-Driven Updates:** Many parameters (e.g., `mute`, `fader`) are "Event Sources." When these values are changed by any controller, the device will spontaneously send a `val` message to all connected clients.

