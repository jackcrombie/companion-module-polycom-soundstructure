# Polycom SoundStructure Companion Module - Implementation Plan

This document tracks the tasks required to build the `companion-module-polycom-soundstructure` module.

## Phase 1: Core Infrastructure & Connection

-   [ ] **Project Setup:**
    -   [ ] Initialize a new Companion module structure.
    -   [ ] Add necessary dependencies (`@companion-module/base`).
    -   [ ] Configure `package.json` and `companion/manifest.json`.
-   [ ] **Main Connection (`main.js`):
    -   [ ] Implement `config` screen for IP Address, Port (default 52774), and Polling Interval.
    -   [ ] Implement `init()` function.
    -   [ ] Create a `TCPHelper` instance for the connection.
    -   [ ] Set up connection listeners (`status_change`, `error`, `data`).
    -   [ ] Implement `destroy()` function to clean up connections.
    -   [ ] Implement robust reconnection logic with exponential backoff.
-   [ ] **Command Queue:**
    -   [ ] Create a queue to manage outgoing commands.
    -   [ ] Implement a mechanism to send commands from the queue sequentially with a small delay.
-   [ ] **Response Parser:**
    -   [ ] Create a centralized function to handle incoming data from the TCP socket.
    -   [ ] Handle different response terminators (`\r`).
    -   [ ] Parse `val <param> "<chan>" <value>` responses.
    -   [ ] Parse `error "<message>"` responses and log them.
    -   [ ] Parse `vcitem ...` responses from `vclist`.

## Phase 2: Discovery & State Management

-   [ ] **State Object:**
    -   [ ] Create a central object to store the module's state (e.g., `this.state`).
    -   [ ] Define the structure for storing virtual channels, presets, and their parameters.
-   [ ] **Initial Discovery (`on 'ok' status`):
    -   [ ] Implement a function `discoverDevice()` to be called on successful connection.
    -   [ ] Send `vclist` to the device.
    -   [ ] Store the returned virtual channels in the state object.
    -   [ ] Send `get presets` to the device and store the list.
    -   [ ] Send `get version` and store the firmware version.
    -   [ ] For each discovered channel, send `get mute` and `get fader` to populate initial state.
    -   [ ] After discovery, call `init_actions()`, `init_feedbacks()`, and `init_variables()`.
-   [ ] **Polling Mechanism:**
    -   [ ] Implement a timer based on the user-configured polling interval.
    -   [ ] On each poll, iterate through feedbacks and variables to identify which values need to be refreshed.
    -   [ ] Send `get` commands for the required parameters.

## Phase 3: Actions (`actions.js`)

-   [ ] **Dynamic Action Generation:**
    -   [ ] Create a helper function to generate dropdown choices from the discovered virtual channels list.
-   [ ] **Channel Actions:**
    -   [ ] `mute`: Set/Toggle Mute (for a chosen channel).
    -   [ ] `fader`: Set/Adjust Gain (for a chosen channel).
    -   [ ] `vcrename`: Set Channel Label.
-   [ ] **Matrix Actions:**
    -   [ ] `matrix_mute`: Set/Toggle Crosspoint Mute (requires two channel dropdowns).
    -   [ ] `matrix_gain`: Set/Adjust Crosspoint Gain.
-   [ ] **Preset Actions:**
    -   [ ] `recall_preset`: Recall a preset from a dynamically populated list.
-   [ ] **Telephony Actions:**
    -   [ ] `phone_dial`: Dial a number.
    -   [ ] `phone_connect`: Answer/Connect a call.
    -   [ ] `phone_flash`: Hang up/End a call (using `phone_flash` with a `phone_connect` 0 might be needed).
-   [ ] **System Actions:**
    -   [ ] `sys_reboot`: Reboot Device.
    -   [ ] `send_raw`: Send a raw command.

## Phase 4: Feedbacks (`feedbacks.js`)

-   [ ] **Channel Feedbacks:**
    -   [ ] `channel_muted`: Check if a channel's mute state is true/false.
    -   [ ] `channel_gain`: Compare a channel's fader level to a given value.
-   [ ] **Matrix Feedbacks:**
    -   [ ] `crosspoint_muted`: Check if a matrix crosspoint is muted.
-   [ ] **Telephony Feedbacks:**
    -   [ ] `call_status`: Check the `phone_connect` or `voip_call_appearance_state` for call status.

## Phase 5: Variables (`variables.js`)

-   [ ] **Dynamic Variable Generation:**
    -   [ ] On discovery, iterate through the virtual channel list.
    -   [ ] For each channel, create variables for `mute` and `fader`.
    -   [ ] Example: `$(polycom-ss:mute_Mic_1)`, `$(polycom-ss:gain_Mic_1)`.
-   [ ] **System Variables:**
    -   [ ] `$(polycom-ss:firmware_version)`
-   [ ] **Variable Updates:**
    -   [ ] Implement `checkVariables()` to update the variable values from the internal state.
    -   [ ] Ensure the response parser updates the internal state correctly, which will then be reflected in the variables.

## Phase 6: Documentation & Refinement

-   [ ] **README.md:**
    -   [ ] Write clear setup instructions.
    -   [ ] Document all available actions, feedbacks, and variables.
    -   [ ] Add a note about the command protocol and port number.
-   [ ] **HELP.md:**
    -   [ ] Provide concise help text for the module within Companion.
-   [ ] **Testing:**
    -   [ ] Test all actions and feedbacks against a live device or simulator.
    -   [ ] Test connection stability and reconnection logic.
    -   [ ] Test dynamic generation with different device configurations.

