# Polycom SoundStructure Companion Module Design (v3)

This document outlines the design for a comprehensive Bitfocus Companion module to control Polycom SoundStructure audio DSPs. This design is based on the official `SoundStructure_CommandProtocol_Guide.pdf` and practical examples.

## 1. Key Features

-   **Auto-Discovery:** Automatically discover the device's IP address and full configuration (all virtual channels, presets, etc.) upon connection.
-   **Real-time, Low-Latency Feedback:** Utilizes the device's event-driven reporting for instant feedback on mutes, gains, and other parameters without polling.
-   **Dynamic Controls:** Actions and feedbacks are dynamically generated based on the discovered device configuration, so channel names and presets are always up-to-date.
-   **Comprehensive Control:** Full control over channel and matrix parameters, audio processing blocks (EQ, Dynamics), preset recall, and telephony functions.

## 2. Core Infrastructure

### 2.1. Connection & Communication

-   **Auto-Discovery (Future):** The module will eventually support mDNS/Bonjour for automatic discovery of SoundStructure devices on the network. Initially, the user will provide an IP address.
-   **TCP Client:** The module will use `TCPHelper` to manage the connection to the SoundStructure device on port **52774**.
-   **Reconnection Logic:** Implement robust reconnection logic with exponential backoff.
-   **Status Indication:** Clearly indicate connection status changes (Connecting, OK, Error, Disconnected).
-   **Command Terminator:** All commands sent to the device will be terminated with `\r\n`. The device responds with `\r` as a terminator.

### 2.2. Command & Response Handling

-   **Command Queue:** A queue will be implemented to send commands sequentially with a short, configurable delay (e.g., 50ms) to prevent overwhelming the device.
-   **Centralized Parser:** A single function will parse all incoming data. It will differentiate between standard command acknowledgements (`val`, `error`), list responses (`vcitem`), and the binary meter stream.
-   **Unsolicited Updates:** The parser will handle spontaneous `val` messages for parameters marked as `Event Source: Yes` in the API. This allows for real-time state updates without polling.

## 3. State Management and Data Subscription

### 3.1. Initial State Discovery

On a successful connection, the module will build its internal state by discovering the device's complete configuration. This will be done by sending the following commands:
-   `vclist`: To get all virtual channels, their types, and labels. This is crucial for populating all dynamic dropdowns.
-   `get presets`: To get the list of all saved presets for the "Recall Preset" action.
-   `get version`: To get the device's firmware version for display and debugging.
-   For each discovered virtual channel, the module will query essential parameters like `mute` and `fader` to establish a baseline state.

### 3.2. Reactive State Management (Event-Driven)

-   **Internal State:** The module will maintain a comprehensive state object reflecting all known values (gains, mutes, filter settings, call status, etc.).
-   **Event-Driven Updates:** The primary method for keeping the state synchronized will be listening for unsolicited `val` messages from the device for parameters marked as `Event Source: Yes` in the API. This is more efficient than polling.
-   **Fallback Polling:** A configurable, low-frequency polling mechanism (default: 10s, 0 to disable) will be used as a fallback to periodically refresh non-event-driven parameters or to recover from any missed messages. This can also be used to poll for meter values if desired by the user.

## 4. Actions

Actions will be dynamically generated based on the discovered `vclist`.

### 4.1. Channel Control
-   **Set/Toggle/Pulse Mute:** For any channel.
-   **Set/Adjust Gain (Fader):** For any channel, with options for `set`, `inc`, and `dec`.
-   **Set Channel Label:** Change the text label of a virtual channel (`vcrename`).

### 4.2. Matrix & Crosspoint Control
-   **Set/Toggle Crosspoint Mute:** Mute/unmute a specific input-to-output crosspoint.
-   **Set/Adjust Crosspoint Gain:** Control the gain of a specific crosspoint.

### 4.3. Audio Processing Blocks
For each relevant channel, with parameters populated dynamically:
-   **Filters (HPF/LPF):** Enable/disable and set frequency.
-   **Parametric EQ (PEQ):** Enable/disable, set gain, frequency, and Q for a specific band.
-   **Dynamics (Compressor/Gate/Limiter):** Enable/disable and configure key parameters (threshold, ratio, etc.).

### 4.4. Preset Control
-   **Recall Preset:** Recall a preset from a dynamically populated list.
-   **Save Preset:** Save the current settings to a specified preset slot.

### 4.5. Telephony Control (PSTN & VoIP)
-   **Dial:** Dial a number.
-   **Answer / Connect Call:** Answer an incoming call or connect an outgoing call.
-   **Hang Up / End Call:** Terminate a call.
-   **Hold / Resume:** Place a call on hold or resume it.

### 4.6. System Control
-   **Reboot Device:** Trigger a system reboot.
-   **Send Raw Command:** For advanced users to send any raw API command.

## 5. Feedbacks

Feedbacks will provide instant visual indication of the device's state using the event-driven model.

-   **Channel Muted:** If a channel is muted.
-   **Channel Gain:** Compare a channel's gain to a specific value (at, above, or below).
-   **Crosspoint Muted:** If a crosspoint is muted.
-   **Processing Block Status:** If a specific processing block (e.g., EQ, Compressor) is enabled on a channel.
-   **Call Status:** Based on the telephony status (e.g., Idle, Ringing, In Call, Hold).

## 6. Variables

The module will expose a rich set of variables.

-   **Channel State:** `$(polycom-ss:gain_[channel_label])`, `$(polycom-ss:mute_[channel_label])`
-   **Telephony:** `$(polycom-ss:call_status_[channel_label])`, `$(polycom-ss:caller_id_[channel_label])`
-   **System Info:** `$(polycom-ss:firmware_version)`, `$(polycom-ss:device_name)`
