# Companion Module for Polycom SoundStructure

This module provides control over Polycom SoundStructure audio DSPs from Bitfocus Companion.

## Configuration

To get started, add an instance of the "Polycom SoundStructure" module to your Companion setup. You will need to provide the following information:

-   **Target IP:** The IP address of your SoundStructure device.
-   **Target Port:** The TCP port for the control protocol. This defaults to `52774`.
-   **Polling Interval:** The interval in milliseconds at which the module will poll for non-event-driven states (like matrix mutes). The default is `10000` (10 seconds).

The module will automatically discover all configured virtual channels and virtual channel groups upon a successful connection.

## Actions

The following actions are available. Channel and group lists are populated dynamically from your device.

-   **Set/Toggle Channel Mute:** Mute, unmute, or toggle the mute status of any individual virtual channel.
-   **Set/Adjust Channel Fader:** Set, increment, or decrement the fader level (in dB) for any individual virtual channel.
-   **Set/Adjust Mic Input Gain:** Set, increment, or decrement the preamp gain for a mic-type input channel.
-   **Set/Adjust Line Output Gain:** Set, increment, or decrement the gain for a line-type output channel.
-   **Set/Toggle Group Mute:** Mute, unmute, or toggle the mute status of a defined Virtual Channel Group.
-   **Set/Toggle Matrix Crosspoint Mute:** Mute, unmute, or toggle the mute status of a specific matrix crosspoint.
-   **Recall Preset:** Recall a saved preset by name.

## Feedbacks

-   **Channel is Muted:** Change the button style if a specific channel is muted.
-   **Group is Muted:** Change the button style if a specific group is muted.
-   **Matrix Crosspoint Muted:** Change the button style if a specific matrix crosspoint is muted.

## Variables

The module exposes the following variables for use in your button text and other parts of Companion.

-   `$(polycom-ss:mute_[channel_label])`: The current mute status for the specified channel or group (`0` for unmated, `1` for muted).
-   `$(polycom-ss:gain_[channel_label])`: The current gain (fader) level in dB for the specified channel or group.
-   `$(polycom-ss:matrix_mute_[input_label]_[output_label])`: The current mute status of a specific matrix crosspoint.
